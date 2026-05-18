const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired } = require('../middlewares/auth');
const { audit } = require('../services/audit');
const { buildSeedRows: buildPhaseKeywordSeedRows } = require('../services/phaseKeywordSeed');
const { ensureSystemDefaultsForCompany } = require('../services/standardPhaseAdvices');
const { seedAllBundlesFromPresetIfAvailable } = require('../services/phasePreset');
const { checkPasswordPolicy } = require('../services/passwordPolicy');
const { loginLimiter, signupLimiter, passwordChangeLimiter, availabilityLimiter, passwordResetLimiter } = require('../middlewares/rateLimit');
const { ensureLoungeMembership } = require('../services/lounge');
const { sendPasswordResetEmail } = require('../services/mail');
const crypto = require('crypto');

const router = express.Router();

// 이메일 정규화 — 모바일 자동 대문자·앞뒤 공백 입력 케이스 흡수.
const emailField = z.string().email().transform((s) => s.trim().toLowerCase());

// 멤버십의 UserPermission을 { feature: bool } 맵으로 (graceful fallback: 테이블 미존재 환경 OK).
async function loadPermissionMap(membershipId) {
  if (!membershipId) return {};
  try {
    const rows = await prisma.userPermission.findMany({
      where: { membershipId },
      select: { feature: true, granted: true },
    });
    const map = {};
    for (const r of rows) map[r.feature] = r.granted;
    return map;
  } catch (e) {
    // user_permissions 테이블 미존재(prod 마이그 미적용) — 빈 맵 폴백
    return {};
  }
}

const nicknameField = z.string().trim().min(2).max(20)
  .regex(/^[가-힣a-zA-Z0-9_\- ]+$/, '닉네임은 한글·영문·숫자·공백·_·-만 가능합니다');

const signupSchema = z.object({
  // 개인 정보 (단계 1)
  email: emailField,
  password: z.string().min(8),
  name: z.string().min(1),
  // 닉네임은 라운지 진입 시점에 받음 (2026-05-18) — 가입 단계에서 더 이상 요구하지 않음
  nickname: nicknameField.optional(),
  phone: z.string().optional(),
  // 회사 정보 (단계 2) — 회사명만 필수, 나머지 견적 갑지·기본 정보로 미리 채움
  companyName: z.string().min(1),
  companyBizNumber: z.string().optional().nullable(),
  companyRepresentative: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  companyEmail: z.string().email().optional().nullable().or(z.literal('')),
});

// 가입 폼 실시간 가용성 체크 — 이메일/닉네임 중 하나만 받아 사용 가능 여부 응답.
// 형식 오류면 available=false + reason. 인증 불필요.
router.get('/check-availability', availabilityLimiter, async (req, res, next) => {
  try {
    const emailRaw = (req.query.email || '').toString().trim();
    const nicknameRaw = (req.query.nickname || '').toString().trim();
    if (emailRaw) {
      const parsed = emailField.safeParse(emailRaw);
      if (!parsed.success) {
        return res.json({ field: 'email', available: false, reason: 'invalid_format' });
      }
      const u = await prisma.user.findUnique({
        where: { email: parsed.data },
        select: { id: true },
      });
      return res.json({ field: 'email', available: !u });
    }
    if (nicknameRaw) {
      const parsed = nicknameField.safeParse(nicknameRaw);
      if (!parsed.success) {
        return res.json({ field: 'nickname', available: false, reason: 'invalid_format' });
      }
      const u = await prisma.user.findUnique({
        where: { nickname: parsed.data },
        select: { id: true },
      });
      return res.json({ field: 'nickname', available: !u });
    }
    return res.status(400).json({ error: 'email 또는 nickname 쿼리 필요' });
  } catch (e) { next(e); }
});

router.post('/signup', signupLimiter, async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);

    // 비번 강도 정책
    const policyErr = checkPasswordPolicy(data.password);
    if (policyErr) return res.status(400).json({ error: policyErr });

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

    // 닉네임 중복 체크 — 가입 시 닉네임을 받지 않으므로 일반적으로 skip. 옛 클라이언트 호환 위해 값이 오면 체크.
    if (data.nickname) {
      const nickExists = await prisma.user.findUnique({ where: { nickname: data.nickname } });
      if (nickExists) return res.status(409).json({ error: '이미 사용 중인 닉네임입니다' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          bizNumber: data.companyBizNumber || null,
          representative: data.companyRepresentative || data.name, // 비어있으면 가입자 이름으로 미리 채움
          address: data.companyAddress || null,
          phone: data.companyPhone || null,
          email: data.companyEmail || data.email, // 비어있으면 가입 이메일로
        },
        // signup 응답에 approvalStatus·plan을 함께 보내기 위해 select 명시
        select: { id: true, name: true, hideExpenses: true, approvalStatus: true, plan: true },
      });
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          nickname: data.nickname || null,
          phone: data.phone,
        },
      });
      await tx.membership.create({
        data: { userId: user.id, companyId: company.id, role: 'OWNER' },
      });
      // 시스템 프리셋 표준 회사가 있으면 4묶음(라벨·키워드·데드라인·어드바이스) 그대로 복사.
      // 없거나 자기 자신이 표준이면 코드 시드로 fallback.
      const presetResult = await seedAllBundlesFromPresetIfAvailable(tx, { targetCompanyId: company.id });
      if (!presetResult.applied) {
        // 표준 25개 phase 기본 키워드 자동 시드 — 일정 자동 인식이 즉시 작동하도록
        const seedRows = buildPhaseKeywordSeedRows().map((r) => ({ ...r, companyId: company.id }));
        await tx.phaseKeywordRule.createMany({ data: seedRows, skipDuplicates: true });
      }
      // 시스템 룰(미확정 알림 D-14/D-7) 자동 보장 — 프리셋 적용 여부와 무관하게 항상 시드
      await ensureSystemDefaultsForCompany(tx, company.id);
      // 라운지 멤버십 즉시 부여 — 베타 진입 통제와 무관하게 자가 가입자가 라운지·루비 다운로드 접근 가능.
      // 회사 승인은 라운지 외 메뉴(견적/일정/지출 등)에서만 게이트.
      await ensureLoungeMembership(tx, user.id, '자가 가입 (회사 승인 무관)');
      return { user, company };
    });

    const token = jwt.sign(
      { sub: result.user.id, companyId: result.company.id, role: 'OWNER', tv: 0 },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit({ user: { id: result.user.id, role: 'OWNER' }, headers: req.headers, ip: req.ip }, 'auth.signup', {
      companyId: result.company.id,
      targetType: 'COMPANY',
      targetId: result.company.id,
      metadata: { companyName: result.company.name },
    });

    res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name, nickname: result.user.nickname, accountType: result.user.accountType || 'COMPANY' },
      company: {
        id: result.company.id,
        name: result.company.name,
        hideExpenses: result.company.hideExpenses,
        approvalStatus: result.company.approvalStatus, // PENDING 디폴트 — 클라이언트 PendingApprovalPage 즉시 분기
        plan: result.company.plan, // 베타 동안 PRO 디폴트 — 헤더 PlanBadge 즉시 표시
      },
      role: 'OWNER',
      permissions: {}, // OWNER는 토글 무시 — 항상 ROLE_DEFAULTS
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// 일반회원 가입 — 회사 없이 라운지·소개 페이지만 사용. 2026-05-14 도입.
// 라운지에서 글 보고 소개 페이지로 회사 대표 가입 유도.
const signupGeneralSchema = z.object({
  email: emailField,
  password: z.string().min(8),
  name: z.string().min(1),
  // 닉네임은 라운지 진입 시점에 받음 (2026-05-18)
  nickname: nicknameField.optional(),
  phone: z.string().optional(),
});

// 시공팀(CREW) 가입 — 본인 1인 회사를 자동 생성 + OWNER로 합류 (2026-05-17 봉기님 정정).
// FREE 등급과 동등하게 모든 운영 기능 사용 가능, 프로젝트 생성만 제외(별도 가드).
// 가입 단계에서 받은 프로필이 거래 회사의 초대 수락 시 Vendor row 자동 생성 입력값으로 사용됨.
const signupCrewSchema = z.object({
  email: emailField,
  password: z.string().min(8),
  name: z.string().min(1),
  // 닉네임은 라운지 진입 시점에 받음 (2026-05-18)
  nickname: nicknameField.optional(),
  phone: z.string().optional(),
  // 시공팀 프로필 — 공종(다중, 최소 1개)만 필수, 나머지 4개는 공란 OK (나중에 본인 또는 회사가 채움)
  crewCategories: z.array(z.string().min(1).max(40)).min(1).max(25),
  crewBankAccount: z.string().max(120).optional().nullable(),
  crewDefaultUnitPrice: z.number().nonnegative().optional().nullable(),
  crewDefaultMeal: z.number().nonnegative().optional().nullable(),
  crewDefaultTransport: z.number().nonnegative().optional().nullable(),
});

router.post('/signup-crew', signupLimiter, async (req, res, next) => {
  try {
    const data = signupCrewSchema.parse(req.body);

    const policyErr = checkPasswordPolicy(data.password);
    if (policyErr) return res.status(400).json({ error: policyErr });

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

    if (data.nickname) {
      const nickExists = await prisma.user.findUnique({ where: { nickname: data.nickname } });
      if (nickExists) return res.status(409).json({ error: '이미 사용 중인 닉네임입니다' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          nickname: data.nickname || null,
          phone: data.phone,
          accountType: 'CREW',
          crewCategories: data.crewCategories.map((c) => c.trim()).filter(Boolean),
          crewBankAccount: data.crewBankAccount?.trim() || null,
          crewDefaultUnitPrice: data.crewDefaultUnitPrice ?? null,
          crewDefaultMeal: data.crewDefaultMeal ?? null,
          crewDefaultTransport: data.crewDefaultTransport ?? null,
        },
      });

      // 시공팀 회사 자동 생성 — 1인 사업자 패턴. 이름=시공팀 본인 이름. 추후 설정에서 수정 가능.
      // CREW 등급은 자동 승인 (베타 진입 통제 우회) — 시공팀은 paying X, 즉시 사용 가능.
      const company = await tx.company.create({
        data: {
          name: data.name,
          representative: data.name,
          email: data.email,
          phone: data.phone || null,
          plan: 'CREW',
          approvalStatus: 'APPROVED',
        },
        select: { id: true, name: true, hideExpenses: true, approvalStatus: true, plan: true },
      });

      await tx.membership.create({
        data: { userId: user.id, companyId: company.id, role: 'OWNER' },
      });

      // 시드 — FREE/CREW도 키워드·시스템 룰은 가지고 시작 (FREE 회사로 운영 가능)
      const presetResult = await seedAllBundlesFromPresetIfAvailable(tx, { targetCompanyId: company.id });
      if (!presetResult.applied) {
        const seedRows = buildPhaseKeywordSeedRows().map((r) => ({ ...r, companyId: company.id }));
        await tx.phaseKeywordRule.createMany({ data: seedRows, skipDuplicates: true });
      }
      await ensureSystemDefaultsForCompany(tx, company.id);
      await ensureLoungeMembership(tx, user.id, '시공팀 가입');

      return { user, company };
    });

    // OWNER + 회사 컨텍스트로 정식 토큰 발급
    const token = jwt.sign(
      {
        sub: result.user.id,
        companyId: result.company.id,
        role: 'OWNER',
        tv: 0,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit({ user: { id: result.user.id, role: 'OWNER' }, headers: req.headers, ip: req.ip }, 'auth.signup-crew', {
      companyId: result.company.id,
      targetType: 'COMPANY',
      targetId: result.company.id,
      metadata: { companyName: result.company.name, email: result.user.email },
    });

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        nickname: result.user.nickname,
        accountType: result.user.accountType,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        hideExpenses: result.company.hideExpenses,
        approvalStatus: result.company.approvalStatus,
        plan: result.company.plan,
      },
      role: 'OWNER',
      permissions: {},
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.post('/signup-general', signupLimiter, async (req, res, next) => {
  try {
    const data = signupGeneralSchema.parse(req.body);

    const policyErr = checkPasswordPolicy(data.password);
    if (policyErr) return res.status(400).json({ error: policyErr });

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

    if (data.nickname) {
      const nickExists = await prisma.user.findUnique({ where: { nickname: data.nickname } });
      if (nickExists) return res.status(409).json({ error: '이미 사용 중인 닉네임입니다' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          nickname: data.nickname || null,
          phone: data.phone,
        },
      });
      // 라운지 즉시 활성화 — 회사 없어도 라운지 활동 가능
      await ensureLoungeMembership(tx, u.id, '일반회원 가입');
      return u;
    });

    // 회사 컨텍스트 없는 토큰 — companyId/role 생략
    const token = jwt.sign(
      { sub: user.id, tv: 0 },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit({ user: { id: user.id, role: null }, headers: req.headers, ip: req.ip }, 'auth.signup-general', {
      targetType: 'USER',
      targetId: user.id,
      metadata: { email: user.email },
    });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, nickname: user.nickname, accountType: user.accountType || 'COMPANY' },
      company: null,
      role: null,
      permissions: {},
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const loginSchema = z.object({
  email: emailField,
  password: z.string(),
});

// 정식 로그인 응답 — 한 번 더 사용하므로 헬퍼화
async function buildLoginResponse(user, membership) {
  const token = jwt.sign(
    {
      sub: user.id,
      companyId: membership?.companyId || null,
      role: membership?.role || null,
      isSuperAdmin: user.isSuperAdmin,
      tv: user.tokenVersion || 0,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
  const permissions = membership ? await loadPermissionMap(membership.id) : {};
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      accountType: user.accountType || 'COMPANY', // CREW면 클라이언트가 시공팀 홈으로 분기
    },
    company: membership
      ? {
          id: membership.company.id,
          name: membership.company.name,
          hideExpenses: membership.company.hideExpenses,
          approvalStatus: membership.company.approvalStatus,
          plan: membership.company.plan,
        }
      : null,
    role: membership?.role || null,
    isSuperAdmin: user.isSuperAdmin,
    permissions,
  };
}

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          include: {
            // 명시 select — phaseLabels 같이 prod에 미반영된 컬럼이 있을 때 fallback 안전.
            // approvalStatus/plan 포함 — 클라이언트 첫 로그인 직후 깜빡임 제거.
            company: { select: { id: true, name: true, hideExpenses: true, approvalStatus: true, plan: true } },
          },
        },
      },
    });
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

    const membership = user.memberships[0];

    // 일반회원(회사 없이 가입)·슈퍼어드민도 회사 없이 로그인 OK.
    // 라운지·IntroHome만 접근 가능, 회사 메뉴는 BetaGate / requireApprovedCompany에서 차단.

    // 2FA 활성 사용자(슈퍼어드민 한정)는 임시 토큰 + needsTotp:true 응답.
    // 클라이언트는 6자리 코드 또는 백업 코드를 /auth/totp/verify에 제출해야 정식 토큰 받음.
    if (user.totpEnabled) {
      const pendingToken = jwt.sign(
        { sub: user.id, purpose: 'totp-pending', tv: user.tokenVersion || 0 },
        env.jwt.secret,
        { expiresIn: '5m' }
      );
      audit(
        { user: { id: user.id, isSuperAdmin: user.isSuperAdmin }, headers: req.headers, ip: req.ip },
        'auth.login-totp-pending',
        { companyId: membership?.companyId || null }
      );
      return res.json({
        needsTotp: true,
        pendingToken,
        email: user.email,
      });
    }

    audit(
      { user: { id: user.id, isSuperAdmin: user.isSuperAdmin, role: membership?.role }, headers: req.headers, ip: req.ip },
      'auth.login',
      { companyId: membership?.companyId || null }
    );

    const response = await buildLoginResponse(user, membership);
    res.json(response);
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// 2FA (TOTP) — 슈퍼어드민 전용. 일반 사용자는 정식 출시 6-B로 미룸.
// ============================================
const totp = require('../services/totp');

// POST /auth/totp/verify — login 임시 토큰 + 6자리 코드(또는 백업 코드) → 정식 토큰
const totpVerifySchema = z.object({
  pendingToken: z.string().min(1),
  code: z.string().min(1),
});

router.post('/totp/verify', loginLimiter, async (req, res, next) => {
  try {
    const data = totpVerifySchema.parse(req.body);

    let payload;
    try {
      payload = jwt.verify(data.pendingToken, env.jwt.secret);
    } catch {
      return res.status(401).json({ error: '인증 시간이 만료되었습니다. 다시 로그인하세요' });
    }
    if (payload.purpose !== 'totp-pending') {
      return res.status(400).json({ error: '잘못된 토큰입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: {
            company: { select: { id: true, name: true, hideExpenses: true, approvalStatus: true, plan: true } },
          },
        },
      },
    });
    if (!user || !user.totpEnabled) return res.status(401).json({ error: '인증 실패' });
    if ((user.tokenVersion || 0) !== (payload.tv || 0)) {
      return res.status(401).json({ error: '토큰이 무효화되었습니다. 다시 로그인하세요' });
    }

    const code = data.code.trim();
    let usedBackupHash = null;

    // 1) TOTP 6자리 코드 검증
    let ok = totp.verifyCode(user.totpSecret, code);
    // 2) 실패 시 백업 코드 매칭 시도 (xxxxx-xxxxx 또는 10자 영숫자)
    if (!ok) {
      usedBackupHash = totp.findMatchingBackupHash(user.totpBackupCodes || [], code);
      if (usedBackupHash) ok = true;
    }
    if (!ok) {
      return res.status(401).json({ error: '인증 코드가 올바르지 않습니다' });
    }

    // 백업 코드 사용 시 해당 해시 제거 (1회용)
    if (usedBackupHash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { totpBackupCodes: { set: (user.totpBackupCodes || []).filter((h) => h !== usedBackupHash) } },
      });
    }

    audit(
      { user: { id: user.id, isSuperAdmin: user.isSuperAdmin }, headers: req.headers, ip: req.ip },
      'auth.login-totp',
      { metadata: { usedBackup: !!usedBackupHash } }
    );

    const membership = user.memberships[0];
    const response = await buildLoginResponse(user, membership);
    res.json({ ...response, usedBackupCode: !!usedBackupHash });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// POST /auth/totp/setup — 시크릿·QR 발급 (아직 활성 X). 슈퍼어드민만.
router.post('/totp/setup', authRequired, async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: '슈퍼어드민만 사용할 수 있습니다' });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, totpEnabled: true },
    });
    if (user.totpEnabled) {
      return res.status(400).json({ error: '이미 2FA가 활성화되어 있습니다. 먼저 비활성 후 재설정하세요' });
    }
    const secret = totp.generateSecret();
    const otpauthUrl = totp.buildOtpauthUrl(user.email, secret);
    const qrDataUrl = await totp.buildQrDataUrl(otpauthUrl);
    // 시크릿은 enable 전까지만 DB에 저장 (활성화 시 검증에 사용)
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
    res.json({ secret, otpauthUrl, qrDataUrl });
  } catch (e) { next(e); }
});

// POST /auth/totp/enable — 6자리 코드 검증 + 활성 + 백업 코드 발급 (한 번만 노출)
const totpEnableSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

router.post('/totp/enable', authRequired, async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: '슈퍼어드민만 사용할 수 있습니다' });
    const data = totpEnableSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, totpSecret: true, totpEnabled: true },
    });
    if (user.totpEnabled) return res.status(400).json({ error: '이미 활성화되어 있습니다' });
    if (!user.totpSecret) return res.status(400).json({ error: '먼저 setup을 호출하세요' });
    if (!totp.verifyCode(user.totpSecret, data.code)) {
      return res.status(401).json({ error: '인증 코드가 올바르지 않습니다' });
    }
    const backupCodes = totp.generateBackupCodes(8);
    const hashes = backupCodes.map((c) => totp.hashBackupCode(c));
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: true, totpBackupCodes: { set: hashes } },
    });
    audit(req, 'auth.totp-enable', {});
    // 백업 코드는 평문 1회 노출 (DB엔 해시만)
    res.json({ ok: true, backupCodes });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// POST /auth/totp/disable — 본인 비번 + 6자리 코드 모두 검증 후 비활성
const totpDisableSchema = z.object({
  password: z.string().min(1),
  code: z.string().min(1),
});

router.post('/totp/disable', authRequired, async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: '슈퍼어드민만 사용할 수 있습니다' });
    const data = totpDisableSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true, totpSecret: true, totpEnabled: true, totpBackupCodes: true },
    });
    if (!user.totpEnabled) return res.status(400).json({ error: '활성화되어 있지 않습니다' });
    const okPw = await bcrypt.compare(data.password, user.passwordHash);
    if (!okPw) return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
    const code = data.code.trim();
    let ok = totp.verifyCode(user.totpSecret, code);
    if (!ok) ok = !!totp.findMatchingBackupHash(user.totpBackupCodes || [], code);
    if (!ok) return res.status(401).json({ error: '인증 코드가 올바르지 않습니다' });
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null, totpBackupCodes: { set: [] } },
    });
    audit(req, 'auth.totp-disable', {});
    res.json({ ok: true });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// GET /auth/totp/status — 슈퍼어드민 본인 2FA 상태 조회
router.get('/totp/status', authRequired, async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: '슈퍼어드민만 사용할 수 있습니다' });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { totpEnabled: true, totpBackupCodes: true },
    });
    res.json({
      enabled: user.totpEnabled,
      backupCodesRemaining: (user.totpBackupCodes || []).length,
    });
  } catch (e) { next(e); }
});

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(40).nullable().optional(),
  nickname: nicknameField.optional(),
});

// GET /api/auth/me — 현재 사용자 + 모든 회사 멤버십 (다중 회사 전환용)
router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: { company: { select: { id: true, name: true, hideExpenses: true, approvalStatus: true, plan: true } } },
        },
      },
    });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    // 현재 회사 멤버십 권한 — 클라이언트 hasFeature 즉시 판정용
    const currentMembership = user.memberships.find((m) => m.companyId === req.user.companyId);
    const permissions = currentMembership ? await loadPermissionMap(currentMembership.id) : {};
    const currentCompany = currentMembership?.company;

    res.json({
      user: { id: user.id, email: user.email, name: user.name, nickname: user.nickname, phone: user.phone, isSuperAdmin: user.isSuperAdmin, accountType: user.accountType || 'COMPANY' },
      memberships: user.memberships.map((m) => ({
        companyId: m.companyId,
        companyName: m.company.name,
        hideExpenses: m.company.hideExpenses,
        approvalStatus: m.company.approvalStatus,
        plan: m.company.plan,
        role: m.role,
      })),
      current: {
        companyId: req.user.companyId,
        role: req.user.role,
        isSuperAdmin: !!req.user.isSuperAdmin,
        // 베타 진입 통제 — APPROVED 외에는 프론트에서 PendingApprovalPage로 redirect
        approvalStatus: currentCompany?.approvalStatus || null,
        // 구독 등급 — 사용 화면에 배지로 표시 + hasFeature 판정에 사용
        plan: currentCompany?.plan || null,
      },
      permissions,
    });
  } catch (e) { next(e); }
});

// POST /api/auth/switch-company — 다른 회사로 JWT 재발급
const switchSchema = z.object({ companyId: z.string().min(1) });

router.post('/switch-company', authRequired, async (req, res, next) => {
  try {
    const data = switchSchema.parse(req.body);

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: req.user.id, companyId: data.companyId } },
      // approvalStatus/plan 포함 — 회사 전환 직후 PendingApproval·PlanBadge 즉시 분기
      include: { company: { select: { id: true, name: true, hideExpenses: true, approvalStatus: true, plan: true } } },
    });
    if (!membership) {
      return res.status(403).json({ error: '소속되지 않은 회사입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, tokenVersion: true, isSuperAdmin: true, accountType: true },
    });

    const token = jwt.sign(
      {
        sub: user.id,
        companyId: membership.companyId,
        role: membership.role,
        isSuperAdmin: user.isSuperAdmin,
        tv: user.tokenVersion || 0,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    const permissions = await loadPermissionMap(membership.id);

    res.json({
      token,
      user: { ...user, accountType: user.accountType || 'COMPANY' },
      company: {
        id: membership.company.id,
        name: membership.company.name,
        hideExpenses: membership.company.hideExpenses,
        approvalStatus: membership.company.approvalStatus,
        plan: membership.company.plan,
      },
      role: membership.role,
      permissions,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    // 닉네임 중복 체크 (변경 요청 시)
    if (data.nickname) {
      const conflict = await prisma.user.findUnique({ where: { nickname: data.nickname } });
      if (conflict && conflict.id !== req.user.id) {
        return res.status(409).json({ error: '이미 사용 중인 닉네임입니다' });
      }
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, nickname: true, phone: true },
    });
    res.json({ user: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// 본인 비밀번호 변경 (current 검증 후 new로 교체)
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post('/change-password', passwordChangeLimiter, authRequired, async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const policyErr = checkPasswordPolicy(data.newPassword);
    if (policyErr) return res.status(400).json({ error: policyErr });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다' });

    if (data.currentPassword === data.newPassword) {
      return res.status(400).json({ error: '새 비밀번호가 현재 비밀번호와 동일합니다' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    // tokenVersion++ 로 모든 기존 세션 무효화. 본인은 응답으로 받은 새 토큰으로 자동 갱신.
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true, tokenVersion: true, isSuperAdmin: true },
    });

    // 본인 새 토큰 발급 — 현재 회사 컨텍스트 유지
    const token = jwt.sign(
      {
        sub: updated.id,
        companyId: req.user.companyId,
        role: req.user.role,
        isSuperAdmin: updated.isSuperAdmin,
        tv: updated.tokenVersion,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit(req, 'auth.password-change', { targetType: 'USER', targetId: updated.id });

    res.json({ ok: true, token });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// 비밀번호 찾기 (재설정) — 메일 링크 방식
// ============================================
// 1) POST /auth/forgot-password { email } → 토큰 발급 + 메일 발송. 응답은 항상 200(이메일 enumeration 차단)
// 2) GET  /auth/reset-password/check?token=... → 토큰 유효성 사전 검증 (UI 분기용)
// 3) POST /auth/reset-password { token, newPassword } → 비번 교체 + tokenVersion++ (전 세션 무효화)
// 보안: 토큰은 평문을 메일로만 전달, DB엔 SHA-256 해시. 1시간·1회용. 새 발급 시 기존 미사용 토큰 무효화.

function hashToken(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

const forgotSchema = z.object({ email: emailField });

router.post('/forgot-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const data = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, email: true, name: true },
    });

    // 사용자 존재 여부와 무관하게 동일 응답 — 이메일 enumeration 방지
    if (user) {
      // 기존 미사용 토큰 일괄 무효화 (한 번에 하나만 유효)
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });

      const plain = crypto.randomBytes(32).toString('hex'); // 64자 hex, brute-force 비현실
      const tokenHash = hashToken(plain);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const resetUrl = `${env.appBaseUrl.replace(/\/$/, '')}/reset-password?token=${plain}`;
      // fire-and-forget — 메일 발송 실패가 응답을 지연시키지 않게
      sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl }).catch((e) => {
        console.error('[auth.forgot-password] 메일 발송 실패:', e?.message || e);
      });

      audit(
        { user: { id: user.id }, headers: req.headers, ip: req.ip },
        'auth.password-reset-request',
        { targetType: 'USER', targetId: user.id, metadata: { email: user.email } }
      );
    }

    // 항상 동일 200 응답
    res.json({ ok: true, message: '가입된 이메일이라면 비밀번호 재설정 안내 메일이 발송됩니다. 메일함을 확인해주세요.' });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: '이메일 형식이 올바르지 않습니다' });
    }
    next(e);
  }
});

// 토큰 유효성 사전 검증 — 클라이언트가 비번 입력 화면을 보여주기 전에 "만료된 링크" 분기에 사용
router.get('/reset-password/check', passwordResetLimiter, async (req, res, next) => {
  try {
    const plain = (req.query.token || '').toString().trim();
    if (!plain) return res.json({ valid: false, reason: 'missing' });

    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(plain) },
      select: { id: true, expiresAt: true, usedAt: true },
    });
    if (!row) return res.json({ valid: false, reason: 'not_found' });
    if (row.usedAt) return res.json({ valid: false, reason: 'used' });
    if (row.expiresAt < new Date()) return res.json({ valid: false, reason: 'expired' });
    res.json({ valid: true });
  } catch (e) { next(e); }
});

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post('/reset-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const data = resetSchema.parse(req.body);

    const policyErr = checkPasswordPolicy(data.newPassword);
    if (policyErr) return res.status(400).json({ error: policyErr });

    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(data.token) },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!row) return res.status(400).json({ error: '유효하지 않은 링크입니다. 다시 비밀번호 찾기를 진행해주세요' });
    if (row.usedAt) return res.status(400).json({ error: '이미 사용된 링크입니다. 다시 비밀번호 찾기를 진행해주세요' });
    if (row.expiresAt < new Date()) return res.status(400).json({ error: '만료된 링크입니다. 다시 비밀번호 찾기를 진행해주세요' });

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    // 트랜잭션: 비번 교체 + tokenVersion++ (전 세션 무효화) + 토큰 사용 표기
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      // 안전상 동일 사용자의 다른 미사용 토큰도 모두 무효화
      prisma.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    audit(
      { user: { id: row.userId }, headers: req.headers, ip: req.ip },
      'auth.password-reset',
      { targetType: 'USER', targetId: row.userId, metadata: { email: row.user.email } }
    );

    res.json({ ok: true, message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.' });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: '토큰 또는 비밀번호 형식이 올바르지 않습니다' });
    }
    next(e);
  }
});

module.exports = router;
