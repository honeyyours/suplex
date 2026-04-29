// 시스템 프리셋 — 표준 회사(`Company.isPhasePresetDefault=true`)의 4묶음을 다른 회사로 snapshot 복사.
// 자세한 정책: 메모리 `수플렉스_설계_시스템프리셋.md`
//
// 4묶음:
//   1) phaseLabels (Company.phaseLabels JSON)
//   2) PhaseKeywordRule
//   3) PhaseDeadlineRule
//   4) PhaseAdvice (ruleType=STANDARD 만 — UNCONFIRMED_CHECK 시스템 룰은 별도)
//
// 사용처:
//   - 신규 회사 가입 시 전체 복사 (auth.routes.js)
//   - 기존 회사 사용자가 묶음별 "리셋" 버튼 누를 때 (phaseRules / phaseKeywords 라우트)

const BUNDLES = ['phaseLabels', 'phaseKeywordRules', 'phaseDeadlineRules', 'phaseAdvices'];

// 표준 회사 조회. 없거나 자기 자신이 표준이면 null 반환 (호출 측이 fallback 시드 사용).
async function findPresetSourceCompany(prismaOrTx, excludeCompanyId = null) {
  const source = await prismaOrTx.company.findFirst({
    where: { isPhasePresetDefault: true },
    select: { id: true, phaseLabels: true },
  });
  if (!source) return null;
  if (excludeCompanyId && source.id === excludeCompanyId) return null;
  return source;
}

// 단일 묶음 적용 — 대상 회사의 해당 묶음을 표준 회사 데이터로 갱신.
// mode='reset': 기존 row 전부 삭제 후 재삽입. mode='seed': 비어있을 때만 채움 (가입 시점용).
async function applyBundleFromPreset(prismaOrTx, { sourceCompanyId, targetCompanyId, bundle, mode = 'reset' }) {
  if (sourceCompanyId === targetCompanyId) return { applied: false, reason: 'same-company' };

  if (bundle === 'phaseLabels') {
    const source = await prismaOrTx.company.findUnique({
      where: { id: sourceCompanyId },
      select: { phaseLabels: true },
    });
    if (!source) return { applied: false, reason: 'source-not-found' };
    if (mode === 'seed') {
      const target = await prismaOrTx.company.findUnique({ where: { id: targetCompanyId }, select: { phaseLabels: true } });
      const isEmpty = !target?.phaseLabels || (typeof target.phaseLabels === 'object' && Object.keys(target.phaseLabels).length === 0);
      if (!isEmpty) return { applied: false, reason: 'target-not-empty' };
    }
    await prismaOrTx.company.update({
      where: { id: targetCompanyId },
      data: { phaseLabels: source.phaseLabels ?? {} },
    });
    return { applied: true, count: 1 };
  }

  if (bundle === 'phaseKeywordRules') {
    if (mode === 'reset') {
      await prismaOrTx.phaseKeywordRule.deleteMany({ where: { companyId: targetCompanyId } });
    } else {
      const cnt = await prismaOrTx.phaseKeywordRule.count({ where: { companyId: targetCompanyId } });
      if (cnt > 0) return { applied: false, reason: 'target-not-empty' };
    }
    const rows = await prismaOrTx.phaseKeywordRule.findMany({
      where: { companyId: sourceCompanyId },
      select: { keyword: true, phase: true, active: true },
    });
    if (rows.length > 0) {
      await prismaOrTx.phaseKeywordRule.createMany({
        data: rows.map((r) => ({ ...r, companyId: targetCompanyId })),
        skipDuplicates: true,
      });
    }
    return { applied: true, count: rows.length };
  }

  if (bundle === 'phaseDeadlineRules') {
    if (mode === 'reset') {
      await prismaOrTx.phaseDeadlineRule.deleteMany({ where: { companyId: targetCompanyId } });
    } else {
      const cnt = await prismaOrTx.phaseDeadlineRule.count({ where: { companyId: targetCompanyId } });
      if (cnt > 0) return { applied: false, reason: 'target-not-empty' };
    }
    const rows = await prismaOrTx.phaseDeadlineRule.findMany({
      where: { companyId: sourceCompanyId },
      select: { phase: true, daysBefore: true, active: true },
    });
    if (rows.length > 0) {
      await prismaOrTx.phaseDeadlineRule.createMany({
        data: rows.map((r) => ({ ...r, companyId: targetCompanyId })),
        skipDuplicates: true,
      });
    }
    return { applied: true, count: rows.length };
  }

  if (bundle === 'phaseAdvices') {
    // STANDARD 만 복사 — UNCONFIRMED_CHECK 시스템 룰은 ensureSystemDefaultsForCompany 가 별도로 보장
    if (mode === 'reset') {
      await prismaOrTx.phaseAdvice.deleteMany({
        where: { companyId: targetCompanyId, ruleType: { not: 'UNCONFIRMED_CHECK' } },
      });
    } else {
      const cnt = await prismaOrTx.phaseAdvice.count({
        where: { companyId: targetCompanyId, ruleType: { not: 'UNCONFIRMED_CHECK' } },
      });
      if (cnt > 0) return { applied: false, reason: 'target-not-empty' };
    }
    const rows = await prismaOrTx.phaseAdvice.findMany({
      where: { companyId: sourceCompanyId, ruleType: { not: 'UNCONFIRMED_CHECK' } },
      select: {
        phase: true, ruleType: true, daysBefore: true, title: true,
        description: true, category: true, requiresPhoto: true, active: true,
      },
    });
    if (rows.length > 0) {
      await prismaOrTx.phaseAdvice.createMany({
        data: rows.map((r) => ({ ...r, companyId: targetCompanyId })),
      });
    }
    return { applied: true, count: rows.length };
  }

  throw new Error(`Unknown bundle: ${bundle}`);
}

// 가입 시 전체 4묶음 시드 — 표준 회사 데이터가 있으면 복사, 없으면 false 리턴(호출 측이 코드 시드 사용).
async function seedAllBundlesFromPresetIfAvailable(tx, { targetCompanyId }) {
  const source = await findPresetSourceCompany(tx, targetCompanyId);
  if (!source) return { applied: false };
  const report = {};
  for (const bundle of BUNDLES) {
    report[bundle] = await applyBundleFromPreset(tx, {
      sourceCompanyId: source.id,
      targetCompanyId,
      bundle,
      mode: 'seed',
    });
  }
  return { applied: true, sourceCompanyId: source.id, report };
}

// 기존 회사 사용자의 단일 묶음 리셋 — 항상 reset 모드(기존 row 삭제 후 표준 데이터로 갱신).
async function resetBundleFromPreset(prisma, { targetCompanyId, bundle }) {
  if (!BUNDLES.includes(bundle)) {
    throw new Error(`Unknown bundle: ${bundle}`);
  }
  const source = await findPresetSourceCompany(prisma, targetCompanyId);
  if (!source) return { applied: false, reason: 'no-preset-source' };
  return prisma.$transaction((tx) => applyBundleFromPreset(tx, {
    sourceCompanyId: source.id,
    targetCompanyId,
    bundle,
    mode: 'reset',
  }));
}

module.exports = {
  BUNDLES,
  findPresetSourceCompany,
  seedAllBundlesFromPresetIfAvailable,
  resetBundleFromPreset,
};
