// 회사 전체 데이터 JSON 임포트 — fullCompanyExport 의 짝.
// 회사 자산 9종 + 모든 프로젝트(모든 하위 모델) 통째 복원.
//
// 핵심 처리:
//   1. 외래키 그래프 매핑 — 모든 row 의 oldId → newId 자동 치환
//   2. 삽입 순서 — 부모 먼저, 자식 나중 (Project → Material → PurchaseOrder → ...)
//   3. Vendor 매핑 3단계 — export vendors[] 이름·카테고리로 매칭 / 새로 생성 / vendor 텍스트 보존
//   4. 사용자 FK — 임포트 실행 OWNER id 로 일괄 채움
//   5. Cloudinary 사진 URL — 그대로 보존 (베타 정책, 정식 출시 시 복사 옵션)
//
// 안전장치: 트랜잭션 1개 + into-empty 모드(기존 프로젝트 > 0 이면 거부) 디폴트.
//
// 참고: phasePreset.js 와 companyAssetImport.js 의 9종 자산 매핑 로직 일부 재활용.

const { KIND: FULL_KIND } = require('./fullCompanyExport');

// id 매핑 헬퍼 — oldId → newId
class IdMap {
  constructor() { this.map = new Map(); }
  set(oldId, newId) { if (oldId) this.map.set(oldId, newId); }
  get(oldId) { return oldId ? (this.map.get(oldId) || null) : null; }
}

// Decimal 안전 변환
const toDec = (v) => (v === null || v === undefined || v === '' ? null : String(v));
const toDate = (v) => (v ? new Date(v) : null);
const truthy = (v, fallback = true) => (v === undefined ? fallback : !!v);

async function importFullCompany(prisma, { companyId, ownerUserId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw Object.assign(new Error('JSON 본문이 비어있습니다'), { status: 400 });
  }
  if (payload.kind !== FULL_KIND) {
    throw Object.assign(
      new Error(`회사 전체 데이터 JSON 이 아닙니다 (kind=${payload.kind}). "전체 데이터 내보내기" 로 만든 파일을 사용해주세요.`),
      { status: 400 }
    );
  }
  if (!ownerUserId) {
    throw Object.assign(new Error('OWNER 사용자 식별 실패'), { status: 401 });
  }

  // 안전장치: 회사가 비어있을 때만 import 허용 (기존 프로젝트 데이터와 섞이지 않게)
  const existingProjects = await prisma.project.count({ where: { companyId } });
  if (existingProjects > 0) {
    throw Object.assign(
      new Error(`회사에 이미 ${existingProjects}개 프로젝트가 있습니다. 전체 데이터 가져오기는 빈 회사에서만 가능합니다. 새 회사를 만들어 시도해주세요.`),
      { status: 409 }
    );
  }

  const report = {
    company: false,
    vendors: { inserted: 0, matched: 0 },
    materialTemplates: 0,
    quoteLineItemTemplates: 0,
    phaseKeywordRules: 0,
    phaseDeadlineRules: 0,
    phaseAdvices: 0,
    companyPhaseTips: 0,
    accountCodes: 0,
    expenseCategoryRules: 0,
    projects: 0,
    materials: 0,
    quotes: 0,
    quoteLines: 0,
    simpleQuotes: 0,
    simpleQuoteLines: 0,
    purchaseOrders: 0,
    dailyScheduleEntries: 0,
    checklists: 0,
    expenses: 0,
    projectMemos: 0,
    photos: 0,
    measurements: 0,
    materialRequests: 0,
    scheduleChanges: 0,
    phaseNotes: 0,
    settlementNotes: 0,
    schedules: 0,
    scheduleTasks: 0,
    dailyReports: 0,
  };

  await prisma.$transaction(
    async (tx) => {
      // ============================================
      // 1. 회사 메타 (rate*, phaseLabels, hideExpenses)
      // ============================================
      if (payload.company && typeof payload.company === 'object') {
        const c = payload.company;
        const updateData = {};
        const rateFields = [
          'rateIndirectMaterial', 'rateIndirectLabor', 'rateIndustrialAcc',
          'rateEmployment', 'rateRetirement', 'rateSafety', 'rateOtherExpense',
          'rateMisc', 'rateGeneralAdmin', 'rateSupervision', 'rateDesign', 'rateVat',
        ];
        for (const f of rateFields) {
          if (c[f] !== undefined && c[f] !== null) updateData[f] = toDec(c[f]);
        }
        if (c.phaseLabels && typeof c.phaseLabels === 'object') updateData.phaseLabels = c.phaseLabels;
        if (typeof c.hideExpenses === 'boolean') updateData.hideExpenses = c.hideExpenses;
        if (Object.keys(updateData).length) {
          await tx.company.update({ where: { id: companyId }, data: updateData });
          report.company = true;
        }
      }

      // ============================================
      // 2. 회사 자산 — 빈 회사라 Seed 모드 = 통째 삽입
      // ============================================
      const accountIdMap = new IdMap();
      const vendorIdMap = new IdMap();

      // 2-1) Vendor (회사 자산 + 프로젝트 export 양쪽에서 참조). oldId 보존 X (export 는 id 없음).
      // 신규 회사 vendor 만들고 (export 의 vendors index 또는 (name, category)) → vendorIdMap
      if (Array.isArray(payload.vendors) && payload.vendors.length) {
        // export 의 vendors[] 는 id 없음 (companyAssetExport 가 select 로 뺌).
        // → projects 안 expense.vendorId / purchaseOrder.vendorId / dailySchedule.vendorId 는
        //   원본 회사의 Vendor.id 를 가리키는데, export 에 그 ID 가 없음.
        // 대안: (name, category) 매칭 — 같은 이름·카테고리의 vendor 가 export 안 vendors[] 에 있으면 그걸로.
        //
        // 그러나 projects 안 row 의 vendorId 는 cuid 라 매칭 불가 → vendorId 는 null 로 두고
        // expense.vendor / purchaseOrder.vendor 텍스트(자유 문자열) 만 보존.
        //
        // 정식 출시 시점에 export 자체에 vendors[] 에 oldId 포함하도록 개선 (다음 사이클).
        for (const v of payload.vendors) {
          const created = await tx.vendor.create({
            data: {
              companyId,
              name: v.name,
              category: v.category,
              contact: v.contact || null,
              phone: v.phone || null,
              unitPrice: toDec(v.unitPrice),
              unit: v.unit || null,
              bankAccount: v.bankAccount || null,
              defaultMeal: toDec(v.defaultMeal),
              defaultTransport: toDec(v.defaultTransport),
              memo: v.memo || null,
            },
            select: { id: true, name: true, category: true },
          });
          // export 안 vendors[] 의 oldId 가 있으면 매핑 (현재 export 는 id 없음)
          if (v.id) vendorIdMap.set(v.id, created.id);
          report.vendors.inserted++;
        }
      }

      // 2-2) MaterialTemplate
      if (Array.isArray(payload.materialTemplates) && payload.materialTemplates.length) {
        const r = await tx.materialTemplate.createMany({
          data: payload.materialTemplates.map((m) => ({
            companyId,
            kind: m.kind || 'FINISH',
            spaceGroup: m.spaceGroup,
            subgroup: m.subgroup || null,
            itemName: m.itemName,
            formKey: m.formKey || null,
            defaultSiteNotes: m.defaultSiteNotes || null,
            essential: !!m.essential,
            orderIndex: m.orderIndex ?? 0,
            active: truthy(m.active),
          })),
        });
        report.materialTemplates = r.count;
      }

      // 2-3) QuoteLineItemTemplate
      if (Array.isArray(payload.quoteLineItemTemplates) && payload.quoteLineItemTemplates.length) {
        const r = await tx.quoteLineItemTemplate.createMany({
          data: payload.quoteLineItemTemplates.map((q) => ({
            companyId,
            workType: q.workType,
            itemName: q.itemName,
            spec: q.spec || null,
            unit: q.unit || null,
            defaultQuantity: toDec(q.defaultQuantity) ?? '1',
            defaultMaterialPrice: toDec(q.defaultMaterialPrice) ?? '0',
            defaultLaborPrice: toDec(q.defaultLaborPrice) ?? '0',
            defaultExpensePrice: toDec(q.defaultExpensePrice) ?? '0',
            active: truthy(q.active),
            orderIndex: q.orderIndex ?? 0,
          })),
        });
        report.quoteLineItemTemplates = r.count;
      }

      // 2-4) PhaseKeywordRule (unique companyId+keyword)
      if (Array.isArray(payload.phaseKeywordRules) && payload.phaseKeywordRules.length) {
        const r = await tx.phaseKeywordRule.createMany({
          data: payload.phaseKeywordRules.map((p) => ({
            companyId,
            keyword: p.keyword,
            phase: p.phase,
            active: truthy(p.active),
          })),
          skipDuplicates: true,
        });
        report.phaseKeywordRules = r.count;
      }

      // 2-5) PhaseDeadlineRule (unique companyId+phase)
      if (Array.isArray(payload.phaseDeadlineRules) && payload.phaseDeadlineRules.length) {
        const r = await tx.phaseDeadlineRule.createMany({
          data: payload.phaseDeadlineRules.map((p) => ({
            companyId,
            phase: p.phase,
            daysBefore: p.daysBefore,
            active: truthy(p.active),
          })),
          skipDuplicates: true,
        });
        report.phaseDeadlineRules = r.count;
      }

      // 2-6) PhaseAdvice (STANDARD 만)
      if (Array.isArray(payload.phaseAdvices) && payload.phaseAdvices.length) {
        const rows = payload.phaseAdvices.filter((a) => (a.ruleType || 'STANDARD') === 'STANDARD');
        if (rows.length) {
          await tx.phaseAdvice.createMany({
            data: rows.map((a) => ({
              companyId,
              phase: a.phase,
              ruleType: 'STANDARD',
              daysBefore: a.daysBefore,
              title: a.title,
              description: a.description || null,
              category: a.category || null,
              requiresPhoto: !!a.requiresPhoto,
              active: truthy(a.active),
            })),
          });
          report.phaseAdvices = rows.length;
        }
      }

      // 2-7) CompanyPhaseTip (unique companyId+phase)
      if (Array.isArray(payload.companyPhaseTips) && payload.companyPhaseTips.length) {
        const r = await tx.companyPhaseTip.createMany({
          data: payload.companyPhaseTips.map((t) => ({
            companyId,
            phase: t.phase,
            body: t.body,
          })),
          skipDuplicates: true,
        });
        report.companyPhaseTips = r.count;
      }

      // 2-8) AccountCode — oldId → newId 매핑 (Expense·ExpenseCategoryRule 참조용)
      if (Array.isArray(payload.accountCodes) && payload.accountCodes.length) {
        for (const a of payload.accountCodes) {
          const created = await tx.accountCode.create({
            data: {
              companyId,
              code: a.code,
              groupName: a.groupName || null,
              active: truthy(a.active),
              orderIndex: a.orderIndex ?? 0,
            },
            select: { id: true },
          });
          if (a.id) accountIdMap.set(a.id, created.id);
          report.accountCodes++;
        }
      }

      // 2-9) ExpenseCategoryRule (accountCodeId 매핑)
      if (Array.isArray(payload.expenseCategoryRules) && payload.expenseCategoryRules.length) {
        await tx.expenseCategoryRule.createMany({
          data: payload.expenseCategoryRules.map((r) => ({
            companyId,
            keyword: r.keyword,
            accountCodeId: r.accountCodeId ? accountIdMap.get(r.accountCodeId) : null,
            siteCode: r.siteCode || null,
            workCategory: r.workCategory || null,
            priority: r.priority ?? 0,
            active: truthy(r.active),
          })),
        });
        report.expenseCategoryRules = payload.expenseCategoryRules.length;
      }

      // ============================================
      // 3. 프로젝트 + 하위 모델 16종
      // ============================================
      if (!Array.isArray(payload.projects) || !payload.projects.length) return;

      for (const p of payload.projects) {
        const materialIdMap = new IdMap();
        const purchaseOrderIdMap = new IdMap();
        const dailyScheduleIdMap = new IdMap();

        // 3-1) Project
        const newProject = await tx.project.create({
          data: {
            companyId,
            createdById: ownerUserId,
            name: p.name,
            customerName: p.customerName || '(미입력)',
            customerPhone: p.customerPhone || null,
            siteAddress: p.siteAddress || '(미입력)',
            contractAmount: toDec(p.contractAmount),
            contractVatRate: toDec(p.contractVatRate),
            startDate: toDate(p.startDate),
            expectedEndDate: toDate(p.expectedEndDate),
            actualEndDate: toDate(p.actualEndDate),
            status: p.status || 'PLANNED',
            doorPassword: p.doorPassword || null,
            siteNotes: p.siteNotes || null,
            area: toDec(p.area),
            siteCode: p.siteCode || null,
            acquisitionSource: p.acquisitionSource || null,
            consultationAttendee: p.consultationAttendee || null,
            memo: p.memo || null,
            pendingMaterialGroups: p.pendingMaterialGroups || [],
          },
          select: { id: true },
        });
        const projectId = newProject.id;
        report.projects++;

        // 3-2) Material (자기 참조 inheritFromMaterialId 는 일단 null)
        if (Array.isArray(p.materials) && p.materials.length) {
          for (const m of p.materials) {
            const created = await tx.material.create({
              data: {
                projectId,
                kind: m.kind || 'FINISH',
                spaceGroup: m.spaceGroup,
                subgroup: m.subgroup || null,
                itemName: m.itemName,
                essential: !!m.essential,
                formKey: m.formKey || null,
                brand: m.brand || null,
                productName: m.productName || null,
                modelCode: m.modelCode || null,
                spec: m.spec || null,
                customSpec: m.customSpec || undefined,
                siteNotes: m.siteNotes || null,
                purchaseSource: m.purchaseSource || null,
                checked: !!m.checked,
                inheritFromMaterialId: null,
                installed: m.installed ?? null,
                size: m.size || null,
                remarks: m.remarks || null,
                sourceUrl: m.sourceUrl || null,
                status: m.status || 'UNDECIDED',
                quantity: toDec(m.quantity),
                unit: m.unit || null,
                unitPrice: toDec(m.unitPrice),
                totalPrice: toDec(m.totalPrice),
                memo: m.memo || null,
                orderIndex: m.orderIndex ?? 0,
                isFavorite: !!m.isFavorite,
              },
              select: { id: true },
            });
            if (m.id) materialIdMap.set(m.id, created.id);
            report.materials++;
          }
          // inheritFromMaterialId 2 차 패치
          for (const m of p.materials) {
            if (m.inheritFromMaterialId && m.id) {
              const newId = materialIdMap.get(m.id);
              const inheritNewId = materialIdMap.get(m.inheritFromMaterialId);
              if (newId && inheritNewId) {
                await tx.material.update({
                  where: { id: newId },
                  data: { inheritFromMaterialId: inheritNewId },
                });
              }
            }
          }
        }

        // 3-3) PurchaseOrder (materialId, vendorId 매핑)
        if (Array.isArray(p.purchaseOrders) && p.purchaseOrders.length) {
          for (const po of p.purchaseOrders) {
            const created = await tx.purchaseOrder.create({
              data: {
                projectId,
                materialId: po.materialId ? materialIdMap.get(po.materialId) : null,
                itemName: po.itemName || '',
                spec: po.spec || null,
                vendor: po.vendor || null,
                vendorId: po.vendorId ? vendorIdMap.get(po.vendorId) : null,
                quantity: toDec(po.quantity),
                unit: po.unit || null,
                unitPrice: toDec(po.unitPrice),
                totalPrice: toDec(po.totalPrice),
                status: po.status || 'PENDING',
                notes: po.notes || null,
                expectedDate: toDate(po.expectedDate),
                orderedAt: toDate(po.orderedAt),
                receivedAt: toDate(po.receivedAt),
                materialChangedAt: toDate(po.materialChangedAt),
              },
              select: { id: true },
            });
            if (po.id) purchaseOrderIdMap.set(po.id, created.id);
            report.purchaseOrders++;
          }
        }

        // 3-4) SimpleQuote + lines
        if (Array.isArray(p.simpleQuotes) && p.simpleQuotes.length) {
          for (const sq of p.simpleQuotes) {
            const created = await tx.simpleQuote.create({
              data: {
                projectId,
                title: sq.title || null,
                round: sq.round ?? 1,
                isConfirmed: !!sq.isConfirmed,
                totalAmount: toDec(sq.totalAmount),
                designRate: toDec(sq.designRate),
                vatRate: toDec(sq.vatRate),
                roundingUnit: sq.roundingUnit ?? null,
                notes: sq.notes || null,
              },
              select: { id: true },
            });
            report.simpleQuotes++;
            if (Array.isArray(sq.lines) && sq.lines.length) {
              await tx.simpleQuoteLine.createMany({
                data: sq.lines.map((ln) => ({
                  simpleQuoteId: created.id,
                  groupName: ln.groupName || null,
                  itemName: ln.itemName || '',
                  spec: ln.spec || null,
                  unit: ln.unit || null,
                  quantity: toDec(ln.quantity),
                  unitPrice: toDec(ln.unitPrice),
                  amount: toDec(ln.amount),
                  notes: ln.notes || null,
                  orderIndex: ln.orderIndex ?? 0,
                })),
              });
              report.simpleQuoteLines += sq.lines.length;
            }
          }
        }

        // 3-5) Quote + lines
        if (Array.isArray(p.quotes) && p.quotes.length) {
          for (const q of p.quotes) {
            const created = await tx.quote.create({
              data: {
                projectId,
                title: q.title || null,
                round: q.round ?? 1,
                isConfirmed: !!q.isConfirmed,
                rateIndirectMaterial: toDec(q.rateIndirectMaterial),
                rateIndirectLabor: toDec(q.rateIndirectLabor),
                rateIndustrialAcc: toDec(q.rateIndustrialAcc),
                rateEmployment: toDec(q.rateEmployment),
                rateRetirement: toDec(q.rateRetirement),
                rateSafety: toDec(q.rateSafety),
                rateOtherExpense: toDec(q.rateOtherExpense),
                rateMisc: toDec(q.rateMisc),
                rateGeneralAdmin: toDec(q.rateGeneralAdmin),
                rateSupervision: toDec(q.rateSupervision),
                rateDesign: toDec(q.rateDesign),
                rateVat: toDec(q.rateVat),
                totalAmount: toDec(q.totalAmount),
                notes: q.notes || null,
              },
              select: { id: true },
            });
            report.quotes++;
            if (Array.isArray(q.lines) && q.lines.length) {
              await tx.quoteLineItem.createMany({
                data: q.lines.map((ln) => ({
                  quoteId: created.id,
                  workType: ln.workType,
                  itemName: ln.itemName || '',
                  spec: ln.spec || null,
                  unit: ln.unit || null,
                  quantity: toDec(ln.quantity),
                  materialPrice: toDec(ln.materialPrice),
                  laborPrice: toDec(ln.laborPrice),
                  expensePrice: toDec(ln.expensePrice),
                  notes: ln.notes || null,
                  orderIndex: ln.orderIndex ?? 0,
                })),
              });
              report.quoteLines += q.lines.length;
            }
          }
        }

        // 3-6) DailyScheduleEntry (vendorId 매핑)
        if (Array.isArray(p.dailyScheduleEntries) && p.dailyScheduleEntries.length) {
          for (const e of p.dailyScheduleEntries) {
            const created = await tx.dailyScheduleEntry.create({
              data: {
                projectId,
                date: toDate(e.date),
                category: e.category || null,
                content: e.content || '',
                confirmed: !!e.confirmed,
                confirmedAt: toDate(e.confirmedAt),
                orderIndex: e.orderIndex ?? 0,
                vendorId: e.vendorId ? vendorIdMap.get(e.vendorId) : null,
                createdById: ownerUserId,
                updatedById: ownerUserId,
              },
              select: { id: true },
            });
            if (e.id) dailyScheduleIdMap.set(e.id, created.id);
            report.dailyScheduleEntries++;
          }
        }

        // 3-7) ProjectChecklist (linkedScheduleId 매핑)
        if (Array.isArray(p.checklists) && p.checklists.length) {
          await tx.projectChecklist.createMany({
            data: p.checklists.map((c) => ({
              projectId,
              phase: c.phase || null,
              category: c.category || 'GENERAL',
              team: c.team || null,
              title: c.title || '',
              isDone: !!c.isDone,
              requiresPhoto: !!c.requiresPhoto,
              dueDate: toDate(c.dueDate),
              completedAt: toDate(c.completedAt),
              completedById: c.isDone ? ownerUserId : null,
              createdById: ownerUserId,
              orderIndex: c.orderIndex ?? 0,
              linkedScheduleId: c.linkedScheduleId ? dailyScheduleIdMap.get(c.linkedScheduleId) : null,
            })),
          });
          report.checklists += p.checklists.length;
        }

        // 3-8) Expense (vendorId, accountCodeId, purchaseOrderId 매핑)
        if (Array.isArray(p.expenses) && p.expenses.length) {
          await tx.expense.createMany({
            data: p.expenses.map((e) => ({
              companyId,
              projectId,
              date: toDate(e.date),
              amount: toDec(e.amount) ?? '0',
              type: e.type || 'EXPENSE',
              vendor: e.vendor || null,
              vendorId: e.vendorId ? vendorIdMap.get(e.vendorId) : null,
              accountCodeId: e.accountCodeId ? accountIdMap.get(e.accountCodeId) : null,
              workCategory: e.workCategory || null,
              description: e.description || null,
              memo: e.memo || null,
              paymentMethod: e.paymentMethod || null,
              purchaseOrderId: e.purchaseOrderId ? purchaseOrderIdMap.get(e.purchaseOrderId) : null,
              importedFrom: e.importedFrom || null,
              rawText: e.rawText || null,
              createdById: ownerUserId,
            })),
          });
          report.expenses += p.expenses.length;
        }

        // 3-9) ProjectMemo
        if (Array.isArray(p.projectMemos) && p.projectMemos.length) {
          await tx.projectMemo.createMany({
            data: p.projectMemos.map((m) => ({
              projectId,
              title: m.title || null,
              content: m.content || '',
              tag: m.tag || null,
              pinned: !!m.pinned,
              orderIndex: m.orderIndex ?? 0,
            })),
          });
          report.projectMemos += p.projectMemos.length;
        }

        // 3-10) ProjectPhoto (uploaderId → OWNER, Cloudinary URL 그대로)
        if (Array.isArray(p.photos) && p.photos.length) {
          await tx.projectPhoto.createMany({
            data: p.photos.map((ph) => ({
              projectId,
              url: ph.url || '',
              publicId: ph.publicId || null,
              width: ph.width ?? null,
              height: ph.height ?? null,
              caption: ph.caption || null,
              category: ph.category || null,
              phase: ph.phase || null,
              uploaderId: ownerUserId,
              archivedAt: toDate(ph.archivedAt),
            })),
          });
          report.photos += p.photos.length;
        }

        // 3-11) Measurement
        if (Array.isArray(p.measurements) && p.measurements.length) {
          await tx.measurement.createMany({
            data: p.measurements.map((m) => ({
              projectId,
              category: m.category || null,
              location: m.location || null,
              dimensions: m.dimensions || undefined,
              calculatedArea: toDec(m.calculatedArea),
              notes: m.notes || null,
              orderIndex: m.orderIndex ?? 0,
            })),
          });
          report.measurements += p.measurements.length;
        }

        // 3-12) MaterialRequest
        if (Array.isArray(p.materialRequests) && p.materialRequests.length) {
          await tx.materialRequest.createMany({
            data: p.materialRequests.map((r) => ({
              projectId,
              requestedById: ownerUserId,
              category: r.category || null,
              itemName: r.itemName || '',
              quantity: r.quantity || null,
              urgency: r.urgency || null,
              status: r.status || 'PENDING',
              notes: r.notes || null,
              respondedAt: toDate(r.respondedAt),
            })),
          });
          report.materialRequests += p.materialRequests.length;
        }

        // 3-13) ScheduleChange
        if (Array.isArray(p.scheduleChanges) && p.scheduleChanges.length) {
          await tx.scheduleChange.createMany({
            data: p.scheduleChanges.map((s) => ({
              projectId,
              entryId: null,
              changeType: s.changeType || 'UPDATE',
              field: s.field || null,
              oldValue: s.oldValue || null,
              newValue: s.newValue || null,
              date: toDate(s.date),
              byUserId: ownerUserId,
              note: s.note || null,
            })),
          });
          report.scheduleChanges += p.scheduleChanges.length;
        }

        // 3-14) ProjectPhaseNote (updatedById → OWNER)
        if (Array.isArray(p.phaseNotes) && p.phaseNotes.length) {
          await tx.projectPhaseNote.createMany({
            data: p.phaseNotes.map((n) => ({
              projectId,
              phase: n.phase,
              body: n.body || '',
              updatedById: ownerUserId,
            })),
          });
          report.phaseNotes += p.phaseNotes.length;
        }

        // 3-15) ProjectSettlementNote
        if (Array.isArray(p.settlementNotes) && p.settlementNotes.length) {
          await tx.projectSettlementNote.createMany({
            data: p.settlementNotes.map((n) => ({
              projectId,
              phase: n.phase || null,
              body: n.body || '',
              updatedById: ownerUserId,
            })),
          });
          report.settlementNotes += p.settlementNotes.length;
        }

        // 3-16) Schedule + ScheduleTask (구식 일정 — 사용 빈도 낮으나 보존)
        if (Array.isArray(p.schedules) && p.schedules.length) {
          for (const s of p.schedules) {
            const created = await tx.schedule.create({
              data: {
                projectId,
                title: s.title || '',
                startDate: toDate(s.startDate),
                endDate: toDate(s.endDate),
                orderIndex: s.orderIndex ?? 0,
              },
              select: { id: true },
            });
            report.schedules++;
            if (Array.isArray(s.tasks) && s.tasks.length) {
              await tx.scheduleTask.createMany({
                data: s.tasks.map((t) => ({
                  scheduleId: created.id,
                  title: t.title || '',
                  startDate: toDate(t.startDate),
                  endDate: toDate(t.endDate),
                  vendorId: t.vendorId ? vendorIdMap.get(t.vendorId) : null,
                  done: !!t.done,
                  orderIndex: t.orderIndex ?? 0,
                })),
              });
              report.scheduleTasks += s.tasks.length;
            }
          }
        }

        // 3-17) DailyReport (authorId → OWNER)
        if (Array.isArray(p.dailyReports) && p.dailyReports.length) {
          await tx.dailyReport.createMany({
            data: p.dailyReports.map((r) => ({
              projectId,
              authorId: ownerUserId,
              date: toDate(r.date),
              workSummary: r.workSummary || '',
              issues: r.issues || null,
              tomorrowPlan: r.tomorrowPlan || null,
              weather: r.weather || null,
              memo: r.memo || null,
            })),
          });
          report.dailyReports += p.dailyReports.length;
        }

        // ProjectMember — 사용자 종속이라 import skip. 기존 projectMembership 훅이 회사 전직원 자동 합류 처리.
      }
    },
    { timeout: 5 * 60 * 1000 /* 5분 — 큰 데이터 import 대비 */ }
  );

  return report;
}

module.exports = { importFullCompany };
