-- 가전 규격 DB 시드 — 자동 크롤링 분 (2026-04-26 수집)
-- 출처: 삼성 SEC / LG lge.co.kr 공식 페이지
-- 생성: appliance-seed-*-from-crawl.json (3개 파일, 366건)
-- 정책: ON CONFLICT (modelCode) DO NOTHING — 기존 데이터 보존
-- 검증 상태: PENDING (단일 출처 — 정식 운영 시 다른 출처와 합의 필요)

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5dd6ea68259a8e75f43e', 'REFRIGERATOR', '삼성', 'RB33A3661AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 2도어 키친핏 333L', 595, 1853, 669, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/RB33A3661AP/RB33A3661AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":669}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_515aec4a60c800715a3f', 'REFRIGERATOR', '삼성', 'RZ24C58E0AP', ARRAY[]::TEXT[], 'Bespoke AI 변온 냉동고 1도어 키친핏 240L (우열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/RZ24C58E0AP/RZ24C58E0AP/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7379a92e3ab79b4d705e', 'REFRIGERATOR', '삼성', 'RZ34A7855AP', ARRAY[]::TEXT[], 'Bespoke 냉동고 1도어 키친핏 347L (우열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/RZ34A7855AP/RZ34A7855AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2dd4529838e9f4282ec4', 'REFRIGERATOR', '삼성', 'BRB70F26D3F0', ARRAY[]::TEXT[], '냉장고 259L', 540, 1775, 550, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/bottom-mount-freezer-brb70f26d3f0-d2c/BRB70F26D3F0/","value":{"widthMm":540,"heightMm":1775,"depthMm":550}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_81daed999b9e37c93e46', 'REFRIGERATOR', '삼성', 'BRB80F26A2F0', ARRAY[]::TEXT[], '냉장고 256L', 540, 1775, 550, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/bottom-mount-freezer-brb80f26a2f0-d2c/BRB80F26A2F0/","value":{"widthMm":540,"heightMm":1775,"depthMm":550}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fe911a76ecf81733586f', 'REFRIGERATOR', '삼성', 'RB30D4051S9', ARRAY[]::TEXT[], '냉장고 306L', 595, 1700, 663, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/bottom-mount-freezer-rb30d4051s9-d2c/RB30D4051S9/","value":{"widthMm":595,"heightMm":1700,"depthMm":663}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_df7e83bcf1c79cf9da9c', 'REFRIGERATOR', '삼성', 'RB30F4051WW', ARRAY[]::TEXT[], '냉장고 306L', 595, 1700, 663, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/bottom-mount-freezer-rb30f4051ww-d2c/RB30F4051WW/","value":{"widthMm":595,"heightMm":1700,"depthMm":663}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_acda85f64015f2f8fd7c', 'REFRIGERATOR', '삼성', 'RB30R3503AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 3도어 296L', 595, 1853, 668, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/bottom-mount-freezer-rb30r3503ap-d2c/RB30R3503AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":668}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e259954cdbd34c7aad15', 'REFRIGERATOR', '삼성', 'RB33R8798SR', ARRAY[]::TEXT[], '냉장고 343L', 595, 1927, 590, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/bottom-mount-freezer-rb33r8798sr-d2c/RB33R8798SR/","value":{"widthMm":595,"heightMm":1927,"depthMm":590}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ecd8ddb893cde3508b37', 'REFRIGERATOR', '삼성', 'BRF425220AP', ARRAY[]::TEXT[], '셰프컬렉션 T-Type 냉장고 621L', 1048, 2118, 605, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/brf425220ap-d2c/BRF425220AP/","value":{"widthMm":1048,"heightMm":2118,"depthMm":605}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c269aa34e2bb87b4349a', 'REFRIGERATOR', '삼성', 'CFD-1144', ARRAY[]::TEXT[], '업소용 냉동고 1087L (냉동전용)', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/cfd-1144/CFD-1144/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3049dbb30fa7ccdb584e', 'REFRIGERATOR', '삼성', 'CFF-0622', ARRAY[]::TEXT[], '업소용 냉동고 500L (냉동전용)', 640, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/cff-0622/CFF-0622/","value":{"widthMm":640,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_437b4259e7fe36f206b0', 'REFRIGERATOR', '삼성', 'CFF-1144', ARRAY[]::TEXT[], '업소용 냉동고 1053L (냉동전용)', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/cff-1144/CFF-1144/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_57132d7de1e13c652497', 'REFRIGERATOR', '삼성', 'CRF-0620', ARRAY[]::TEXT[], '업소용 냉장고 505L (냉장전용)', 640, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crf-0620/CRF-0620/","value":{"widthMm":640,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c96d6aca57cfa9c748a6', 'REFRIGERATOR', '삼성', 'CRF-1140', ARRAY[]::TEXT[], '업소용 냉장고 1081L (냉장전용)', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crf-1140/CRF-1140/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_dedb8a67962b8e03cc3d', 'REFRIGERATOR', '삼성', 'CRFD-1141', ARRAY[]::TEXT[], '업소용 냉장고 1056L', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crfd-1141/CRFD-1141/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_75e7d15132d1cab90fe1', 'REFRIGERATOR', '삼성', 'CRFD-1142', ARRAY[]::TEXT[], '업소용 냉장고 1049L', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crfd-1142/CRFD-1142/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cf44e37026a39fb93eeb', 'REFRIGERATOR', '삼성', 'CRFD-1762', ARRAY[]::TEXT[], '업소용 냉장고 1643L', 1900, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crfd-1762/CRFD-1762/","value":{"widthMm":1900,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e51de43c00cfd4f5290e', 'REFRIGERATOR', '삼성', 'CRFF-1141', ARRAY[]::TEXT[], '업소용 냉장고 1021L', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crff-1141/CRFF-1141/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_30aedad4b9babd732dcd', 'REFRIGERATOR', '삼성', 'CRFF-1142', ARRAY[]::TEXT[], '업소용 냉장고 1014L', 1260, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crff-1142/CRFF-1142/","value":{"widthMm":1260,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_92b56ff486d05d87afd0', 'REFRIGERATOR', '삼성', 'CRFF-1762', ARRAY[]::TEXT[], '업소용 냉장고 1608L', 1900, 1830, 800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/crff-1762/CRFF-1762/","value":{"widthMm":1900,"heightMm":1830,"depthMm":800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1e9265a3d8cd87c50548', 'REFRIGERATOR', '삼성', 'RF10B9965APG', ARRAY[]::TEXT[], 'Infinite Line 냉장고 4도어 900L (오토 듀얼 아이스/칵테일&큐브)', 912, 1856, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf10b9965apg-d2c/RF10B9965APG/","value":{"widthMm":912,"heightMm":1856,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_bd74591faf5b63d8f4f3', 'REFRIGERATOR', '삼성', 'RF60A91R1AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 4도어 키친핏 584L (UV탈취)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf60a91r1ap-d2c/RF60A91R1AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9dfe9786525ebc07d958', 'REFRIGERATOR', '삼성', 'RF60B99Z2APG', ARRAY[]::TEXT[], 'Infinite Line 냉장고 4도어 키친핏 596L (빅아이스/큐브)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf60b99z2apg-d2c/RF60B99Z2APG/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6cc65b08fcec46156ab1', 'REFRIGERATOR', '삼성', 'RF60DB9342AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 596L (빅아이스/위스키볼)', 912, 1853, 683, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf60db9342ap-d2c/RF60DB9342AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":683}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6d408efe13bd4fb06f29', 'REFRIGERATOR', '삼성', 'RF60DB9A62APG', ARRAY[]::TEXT[], 'Infinite AI 정수기 냉장고 4도어 키친핏 585L (오토 아이스/위스키볼)', 912, 1853, 683, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf60db9a62apg-d2c/RF60DB9A62APG/","value":{"widthMm":912,"heightMm":1853,"depthMm":683}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cff738e506e985007675', 'REFRIGERATOR', '삼성', 'RF60DB9K41AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 597L (빅아이스/위스키볼)', 912, 1853, 683, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf60db9k41ap-d2c/RF60DB9K41AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":683}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d5fbce02f787fe945db0', 'REFRIGERATOR', '삼성', 'RF84R9203S8', ARRAY[]::TEXT[], 'T9000 2.0 푸드쇼케이스 848L', 908, 1825, 932, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf84r9203s8-d2c/RF84R9203S8/","value":{"widthMm":908,"heightMm":1825,"depthMm":932}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_967cbc975e0bf66a8ad6', 'REFRIGERATOR', '삼성', 'RF85A95E1APN', ARRAY[]::TEXT[], 'Bespoke AI 패밀리허브 4도어 838L (빅아이스/큐브)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85a95e1apw-d2c/RF85A95E1APN/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f8b9be95e377d4b6406f', 'REFRIGERATOR', '삼성', 'RF85B92313Y', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 865L (UV탈취)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85b9231ap-d2c/RF85B92313Y/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8863deda77b4cba46fcd', 'REFRIGERATOR', '삼성', 'RF85C90F1AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 875L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85c90f1ap-d2c/RF85C90F1AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5cf188fcda877a7d5a41', 'REFRIGERATOR', '삼성', 'RF85C91M1AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 852L (빅아이스/큐브)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85c91m1ap-d2c/RF85C91M1AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1070978ccac196a916d4', 'REFRIGERATOR', '삼성', 'RF85C9481AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 846L (빅아이스/위스키볼)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85c9481ap-d2c/RF85C9481AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c911a0ea32ba05438850', 'REFRIGERATOR', '삼성', 'RF85DB91F1AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 869L (UV탈취)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85db91f1ap-d2c/RF85DB91F1AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f78d817f7ce041f8ed95', 'REFRIGERATOR', '삼성', 'RF85DB9481AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 847L (빅아이스/위스키볼)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85db9481ap-d2c/RF85DB9481AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8217887a3fefebfd3e7a', 'REFRIGERATOR', '삼성', 'RF85DB9581APW', ARRAY[]::TEXT[], 'Bespoke AI 패밀리허브 4도어 842L (빅아이스/위스키볼)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85db9581apw-d2c/RF85DB9581APW/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_36e0cd558c6ce584c8f8', 'REFRIGERATOR', '삼성', 'RF85DB95A2APW', ARRAY[]::TEXT[], 'Bespoke AI 패밀리허브 4도어 861L (UV탈취)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85db95a2apw-d2c/RF85DB95A2APW/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_931b301431731cff2955', 'REFRIGERATOR', '삼성', 'RF85DB9792AP', ARRAY[]::TEXT[], 'Bespoke AI 정수기 냉장고 4도어 830L (오토 듀얼 아이스/위스키볼&큐브)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85db9792ap-d2c/RF85DB9792AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d12c215869b8177aeaa3', 'REFRIGERATOR', '삼성', 'RF90DG90124E', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 905L', 912, 1830, 908, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf90dg90124e-d2c/RF90DG90124E/","value":{"widthMm":912,"heightMm":1830,"depthMm":908}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_571ccde573405e0a96d5', 'REFRIGERATOR', '삼성', 'RF90DG9111S9', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 902L', 912, 1830, 908, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf90dg91114e-d2c/RF90DG9111S9/","value":{"widthMm":912,"heightMm":1830,"depthMm":908}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_818f36e9040d4b28a05c', 'REFRIGERATOR', '삼성', 'RF91DB90LEW6', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 900L (에너지 1등급 최저기준 대비 -30%)', 912, 1870, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf91db90le01-d2c/RF91DB90LEW6/","value":{"widthMm":912,"heightMm":1870,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ad4bf56669ec99ba0cbe', 'REFRIGERATOR', '삼성', 'RF91DB92K1AP', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 871L (빅아이스/큐브)', 912, 1870, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf91db92k1ap-d2c/RF91DB92K1AP/","value":{"widthMm":912,"heightMm":1870,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5d0f89fb4029227002dc', 'REFRIGERATOR', '삼성', 'RF91DB98J1AP', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 868L (빅아이스/위스키볼)', 912, 1870, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf91db98j1ap-d2c/RF91DB98J1AP/","value":{"widthMm":912,"heightMm":1870,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b3729afe9a49d99fabeb', 'REFRIGERATOR', '삼성', 'RM70F63M2Z', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max 636L (푸드 쇼케이스)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f63m2z-d2c/RM70F63M2Z/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2798604bebb881379081', 'REFRIGERATOR', '삼성', 'RM70F64M2A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max 633L (푸드 쇼케이스)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f64m2a-d2c/RM70F64M2A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0970edc41f5f7b9f3dec', 'REFRIGERATOR', '삼성', 'RM70F64Q1A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max 623L (빅아이스/큐브)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f64q1a-d2c/RM70F64Q1A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_bafaba469b08dbab97a9', 'REFRIGERATOR', '삼성', 'RM70F64R1G', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max 637L (UV탈취)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f64r1g-d2c/RM70F64R1G/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a4454ba2f5ea6141ab34', 'REFRIGERATOR', '삼성', 'RM70F90M1ZD', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 902L', 912, 1830, 922, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f90m1zd-d2c/RM70F90M1ZD/","value":{"widthMm":912,"heightMm":1830,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c3c0dfb2933b41c879e4', 'REFRIGERATOR', '삼성', 'RM70F90M2D', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 902L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f90m2d-d2c/RM70F90M2D/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e9240aa455a91c2e3c2d', 'REFRIGERATOR', '삼성', 'RM70F90Q2A', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 884L (빅아이스/큐브)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f90q2a-d2c/RM70F90Q2A/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a6285af6010c1cb91f4e', 'REFRIGERATOR', '삼성', 'RM70F90R1ZD', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 905L', 912, 1830, 922, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f90r1zd-d2c/RM70F90R1ZD/","value":{"widthMm":912,"heightMm":1830,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_df932dfbc4c88198aa1a', 'REFRIGERATOR', '삼성', 'RM70F90R2D', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 905L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f90r2d-d2c/RM70F90R2D/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d7ff00601171212b4968', 'REFRIGERATOR', '삼성', 'RM70F91R1A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 901L (UV탈취)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f91r1a-d2c/RM70F91R1A/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fea95049cccfb4936be8', 'REFRIGERATOR', '삼성', 'RM70F91RMA', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 901L (에너지 1등급 최저기준 대비 -30%, UV탈취)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70f91rma-d2c/RM70F91RMA/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_31b92ecd0d6b3bbd424d', 'REFRIGERATOR', '삼성', 'RM70H91RMA', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 901L (에너지 1등급 최저기준 대비 -35%, UV탈취)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm70h91rma-d2c/RM70H91RMA/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_78a24602bba022fd3f0b', 'REFRIGERATOR', '삼성', 'RM80F64L2A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max 611L (푸드 쇼케이스)', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm80f64l2a-d2c/RM80F64L2A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_83cd964ab0ae52348aeb', 'REFRIGERATOR', '삼성', 'RM80F91H1W', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 874L (오토오픈도어)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm80f91h1w-d2c/RM80F91H1W/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_91f3bfb7e4a2dcc33850', 'REFRIGERATOR', '삼성', 'RM80F91L1A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 875L (오토오픈도어)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm80f91l1a-d2c/RM80F91L1A/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4717a22547bdb4259f82', 'REFRIGERATOR', '삼성', 'RM80F91M1XJ', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 894L (오토오픈도어)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm80f91m1xj-d2c/RM80F91M1XJ/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ddc992f0f3d43912e862', 'REFRIGERATOR', '삼성', 'RM90F91B1W', ARRAY[]::TEXT[], 'Bespoke AI 패밀리허브 4도어 864L (AI 비전 인사이드)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm90f91b1w-d2c/RM90F91B1W/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d673bb084b442f2c8bc2', 'REFRIGERATOR', '삼성', 'RM90F91D1W', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 864L (AI 홈)', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm90f91d1w-d2c/RM90F91D1W/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e22e4ba6b480d00e3f71', 'REFRIGERATOR', '삼성', 'RM90H64P2W', ARRAY[]::TEXT[], 'Bespoke AI 패밀리허브 4도어 키친핏 Max 602L (22.5cm, AI 푸드매니저)', 912, 1853, 683, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm90h64p2w-d2c/RM90H64P2W/","value":{"widthMm":912,"heightMm":1853,"depthMm":683}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1bb0686d51de5bb42eaf', 'REFRIGERATOR', '삼성', 'RM90H91B1W', ARRAY[]::TEXT[], 'Bespoke AI 패밀리허브 4도어 864L (81.2cm, AI 푸드매니저)', 912, 1853, 916, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rm90h91b1w-d2c/RM90H91B1W/","value":{"widthMm":912,"heightMm":1853,"depthMm":916}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_931934fcb00d20150e44', 'REFRIGERATOR', '삼성', 'BRR297231WW', ARRAY[]::TEXT[], '빌트인 냉장고 278L', 540, 1775, 550, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-brr297231ww-d2c/BRR297231WW/","value":{"widthMm":540,"heightMm":1775,"depthMm":550}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_90e55e8963c42aa1781f', 'REFRIGERATOR', '삼성', 'BRZ227200WW', ARRAY[]::TEXT[], '빌트인 냉동고 211L', 540, 1775, 550, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-brz227200ww-d2c/BRZ227200WW/","value":{"widthMm":540,"heightMm":1775,"depthMm":550}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ac1b14c90670a994805b', 'REFRIGERATOR', '삼성', 'RR09BG014WW', ARRAY[]::TEXT[], '냉장고 89L (냉장전용)', 475, 842, 448, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr09bg014ww-d2c/RR09BG014WW/","value":{"widthMm":475,"heightMm":842,"depthMm":448}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2c0a03e25831af72a1cc', 'REFRIGERATOR', '삼성', 'RR39A7605AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 380L (좌열림/열림방향 가변, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr39a7605ap-d2c/RR39A7605AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d2be6c0a9ee4b4a213db', 'REFRIGERATOR', '삼성', 'RR39A7685AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 380L (좌열림/열림방향 가변, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr39a7685ap-d2c/RR39A7685AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b5f8eb5a917b6da170d2', 'REFRIGERATOR', '삼성', 'RR39A7695AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 380L (좌열림/열림방향 가변, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr39a7695ap-d2c/RR39A7695AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_41c90e1636a99ec1151f', 'REFRIGERATOR', '삼성', 'RR40A7895AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 408L (우열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40a7895ap-d2c/RR40A7895AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_513a6fe13639a1e05be5', 'REFRIGERATOR', '삼성', 'RR40A7905AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 409L (좌열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40a7905ap-d2c/RR40A7905AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_22ec43ba59828bfd02e5', 'REFRIGERATOR', '삼성', 'RR40A7885AP', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 409L (우열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40a7985ap-d2c/RR40A7885AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_59161cd2dc4f4bb3daba', 'REFRIGERATOR', '삼성', 'RR40B78A5AP', ARRAY[]::TEXT[], 'Bespoke 정수기 냉장고 1도어 키친핏 399L (우열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40b78a5ap-d2c/RR40B78A5AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_80288cfc218c187be083', 'REFRIGERATOR', '삼성', 'RR40B9971APK', ARRAY[]::TEXT[], 'Infinite Line 냉장고 1도어 키친핏 396L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40b9971apk-d2c/RR40B9971APK/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_eab0db153cf55631a96b', 'REFRIGERATOR', '삼성', 'RR40B9981APK', ARRAY[]::TEXT[], 'Infinite Line 냉장고 1도어 키친핏 386L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40b9981apk-d2c/RR40B9981APK/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cb3dfc9b22d482cd8e92', 'REFRIGERATOR', '삼성', 'RR40C7805AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 1도어 키친핏 409L (우열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c7805ap-d2c/RR40C7805AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2987aff427bf9b852969', 'REFRIGERATOR', '삼성', 'RR40C7985AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 1도어 키친핏 409L (좌열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c7885ap-d2c/RR40C7985AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5b47813cb9ebddf3d1e6', 'REFRIGERATOR', '삼성', 'RR40C7895AP', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 1도어 키친핏 408L (우열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c7895ap-d2c/RR40C7895AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4d29966edacf74f4769a', 'REFRIGERATOR', '삼성', 'RR40C8995APG', ARRAY[]::TEXT[], 'Infinite AI 냉장고 1도어 키친핏 408L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c8995apg-d2c/RR40C8995APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f45125174b0682b34bfa', 'REFRIGERATOR', '삼성', 'RR40C89A5APG', ARRAY[]::TEXT[], 'Infinite AI 정수기 냉장고 1도어 키친핏 399L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c89a5apg-d2c/RR40C89A5APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9d1945b2181bb1cb4474', 'REFRIGERATOR', '삼성', 'RR40C9971APG', ARRAY[]::TEXT[], 'Infinite AI 냉장고 1도어 키친핏 396L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c9971apg-d2c/RR40C9971APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_58a3fc1ac6ae26069880', 'REFRIGERATOR', '삼성', 'RR40C9981APG', ARRAY[]::TEXT[], 'Infinite AI 정수기 냉장고 1도어 키친핏 386L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rr40c9981apg-d2c/RR40C9981APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_95bdee757f108b76495d', 'REFRIGERATOR', '삼성', 'RT09DG004WW', ARRAY[]::TEXT[], '냉장고 82L', 475, 850, 515, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rt09dg004ww-d2c/RT09DG004WW/","value":{"widthMm":475,"heightMm":850,"depthMm":515}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e872015dbb6cfb2eb8f8', 'REFRIGERATOR', '삼성', 'RW33B9981APG', ARRAY[]::TEXT[], 'Infinite Line 와인냉장고 1도어 키친핏 101병 (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rw33b9981apg-d2c/RW33B9981APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4a7bd7cdb7ab30216a5e', 'REFRIGERATOR', '삼성', 'RW33B9981APK', ARRAY[]::TEXT[], 'Infinite Line 와인냉장고 1도어 키친핏 101병 (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rw33b9981apk-d2c/RW33B9981APK/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0e6b312044321bff6b01', 'REFRIGERATOR', '삼성', 'RW33B99B1TFG', ARRAY[]::TEXT[], 'Infinite Line 와인냉장고 1도어 키친핏 101병 (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rw33b99b1tfg-d2c/RW33B99B1TFG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1caffc6c775308ba968b', 'REFRIGERATOR', '삼성', 'RW33C99B1TFG', ARRAY[]::TEXT[], 'Infinite Line 와인냉장고 1도어 키친핏 101병 (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rw33c99b1tfg-d2c/RW33C99B1TFG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_497845713a0615cd0985', 'REFRIGERATOR', '삼성', 'RW99H33WN0', ARRAY[]::TEXT[], 'Infinite AI 와인냉장고 1도어 키친핏 101병 (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rw99h33wn0-d2c/RW99H33WN0/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ad1d8b8950b892d1a3f5', 'REFRIGERATOR', '삼성', 'RZ22FG4000S9', ARRAY[]::TEXT[], '냉동고 227L (냉동전용)', 595, 1720, 590, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz22fg4000s9-d2c/RZ22FG4000S9/","value":{"widthMm":595,"heightMm":1720,"depthMm":590}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d91174261d57628b01b6', 'REFRIGERATOR', '삼성', 'RZ24A5660AP', ARRAY[]::TEXT[], 'Bespoke 변온 냉동고 1도어 키친핏 240L (우열림/열림방향 가변)', 455, 1853, 685, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz24a5660ap-d2c/RZ24A5660AP/","value":{"widthMm":455,"heightMm":1853,"depthMm":685}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fc5f3821b709e6fcca33', 'REFRIGERATOR', '삼성', 'RZ24A58G0AP', ARRAY[]::TEXT[], 'Bespoke 변온 냉동고 1도어 키친핏 240L (우열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz24a58g0ap-d2c/RZ24A58G0AP/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d922293c6bffee52496b', 'REFRIGERATOR', '삼성', 'RZ24A59G0AP', ARRAY[]::TEXT[], 'Bespoke 변온 냉동고 1도어 키친핏 240L (좌열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz24a59g0ap-d2c/RZ24A59G0AP/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_acd99046da10ae895938', 'REFRIGERATOR', '삼성', 'RZ24C58G0AP', ARRAY[]::TEXT[], 'Bespoke AI 변온 냉동고 1도어 키친핏 240L (우열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz24c58g0ap-d2c/RZ24C58G0AP/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ea4c347bac38bfa6712b', 'REFRIGERATOR', '삼성', 'RZ32A7665AP', ARRAY[]::TEXT[], 'Bespoke 냉동고 1도어 키친핏 318L (우열림/열림방향 가변, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz32a7665ap-d2c/RZ32A7665AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_213d6921d043b63152ee', 'REFRIGERATOR', '삼성', 'RZ34A7905AP', ARRAY[]::TEXT[], 'Bespoke 냉동고 1도어 키친핏 347L (좌열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz34a7905ap-d2c/RZ34A7905AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1e68d2e71793ca4836fc', 'REFRIGERATOR', '삼성', 'RZ34B78A5AP', ARRAY[]::TEXT[], 'Bespoke 냉동고 1도어 키친핏 306L (우열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz34b78a5ap-d2c/RZ34B78A5AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_33bd9cffff463166a260', 'REFRIGERATOR', '삼성', 'RZ34C7805AP', ARRAY[]::TEXT[], 'Bespoke AI 냉동고 1도어 키친핏 347L (우열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz34c7805ap-d2c/RZ34C7805AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_55c760716fb325723a00', 'REFRIGERATOR', '삼성', 'RZ34C7855AP', ARRAY[]::TEXT[], 'Bespoke AI 냉동고 1도어 키친핏 347L (우열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz34c7855ap-d2c/RZ34C7855AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b8f7eb0f8522d65e2549', 'REFRIGERATOR', '삼성', 'RZ34C8865APG', ARRAY[]::TEXT[], 'Infinite AI 냉동고 1도어 키친핏 347L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz34c8865apg-d2c/RZ34C8865APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_92afd0bcae480bd8195d', 'REFRIGERATOR', '삼성', 'RZ38B9871APG', ARRAY[]::TEXT[], 'Infinite Line 냉동고 1도어 키친핏 404L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz38b9871apg-d2c/RZ38B9871APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9ba7aefb0cefebbe75ef', 'REFRIGERATOR', '삼성', 'RZ38B9881APG', ARRAY[]::TEXT[], 'Infinite Line 냉동고 1도어 키친핏 379L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz38b9881apg-d2c/RZ38B9881APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f031823c9d5338a6397f', 'REFRIGERATOR', '삼성', 'RZ38B9891APG', ARRAY[]::TEXT[], 'Infinite Line 냉동고 1도어 키친핏 379L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz38b9891apg-d2c/RZ38B9891APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_141ceb75d3f71c5eb78f', 'REFRIGERATOR', '삼성', 'RZ38C9891APG', ARRAY[]::TEXT[], 'Infinite AI 냉동고 1도어 키친핏 379L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/one-door-rz38c9891apg-d2c/RZ38C9891APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_206f0d4d512832172a46', 'REFRIGERATOR', '삼성', 'RZ24A59A0AP', ARRAY[]::TEXT[], 'Bespoke 변온 냉동고 1도어 키친핏 240L (좌열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/onedoor-rz24a59a0ap-d2c/RZ24A59A0AP/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fc4f71974c1a673afc92', 'REFRIGERATOR', '삼성', 'RM63R274C1ARQ', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max+김치플러스 3도어 키친핏 640/313L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm63r274c1arq-d2c/RM63R274C1ARQ/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_83e3435f652b2020ddb9', 'REFRIGERATOR', '삼성', 'RM63R27915ARQ', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max+김치플러스 1도어 키친핏 640/348L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm63r27915arq-d2c/RM63R27915ARQ/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c125282d111f89e100e4', 'REFRIGERATOR', '삼성', 'RM70F33C101', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max+김치플러스 3도어 키친핏 623/313L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f33c101-d2c/RM70F33C101/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a05316f4589e73297851', 'REFRIGERATOR', '삼성', 'RM70F33GDAB', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max+김치플러스 3도어 키친핏 623/313L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f33gdab-d2c/RM70F33GDAB/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4eb8b7499a9ca0145981', 'REFRIGERATOR', '삼성', 'RM70F63R242M2A', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max+김치플러스 4도어 키친핏 Max 640/420L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f63r242m2a-d2c/RM70F63R242M2A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_615ea15fd29e024e6122', 'REFRIGERATOR', '삼성', 'RM70F63R242M3Z', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max+김치플러스 4도어 키친핏 Max 640/420L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f63r242m3z-d2c/RM70F63R242M3Z/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_58eb769b34f5570b10f4', 'REFRIGERATOR', '삼성', 'RM70F63R27955A', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max+냉동고 1도어 키친핏 640/347L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f63r27955a-d2c/RM70F63R27955A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3a8c9b94c419903e0a0c', 'REFRIGERATOR', '삼성', 'RM70F63R2F2ZG', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏+김치플러스 4도어 키친핏 Max 640/420L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f63r2f2zg-d2c/RM70F63R2F2ZG/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0fe7776a65677d3f8096', 'REFRIGERATOR', '삼성', 'RM70F63R2M2ZG', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어 키친핏 Max+김치플러스 4도어 키친핏 Max 640/420L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f63r2m2zg-d2c/RM70F63R2M2ZG/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7209c3b9f39ce9b1fca1', 'REFRIGERATOR', '삼성', 'RM70F64Q174C1A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어 키친핏 Max+김치플러스 3도어 키친핏 623/313L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f64q174c1a-d2c/RM70F64Q174C1A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_49da995a0fa9eac20aca', 'REFRIGERATOR', '삼성', 'RM70F64R17955A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 냉장고 4도어 키친핏Max+냉동고 1도어 키친핏 637/347L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f64r17955a-d2c/RM70F64R17955A/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2bfe544bd28392300996', 'REFRIGERATOR', '삼성', 'RM70F90M1M2ZD', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어+김치플러스 4도어 902/490L', 912, 1830, 922, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f90m1m2zd-d2c/RM70F90M1M2ZD/","value":{"widthMm":912,"heightMm":1830,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d4489f85ac66085fae97', 'REFRIGERATOR', '삼성', 'RM70F90M2M1ZG', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어+김치플러스 4도어 902/586L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f90m2m1zg-d2c/RM70F90M2M1ZG/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e6f6c7fa1b528c1a424a', 'REFRIGERATOR', '삼성', 'RM70F90R2M1ZG', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어+김치플러스 4도어 905/586L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f90r2m1zg-d2c/RM70F90R2M1ZG/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cb49d1d4a8e736d2887b', 'REFRIGERATOR', '삼성', 'RM70F91RM7955A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 냉장고 4도어+냉동고 1도어 키친핏 901/347L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f91rm7955a-d2c/RM70F91RM7955A/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_60306c2259cb8d2cd8b3', 'REFRIGERATOR', '삼성', 'RM70F91RM94U1A', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 4도어+김치플러스 4도어 901/583L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm70f91rm94u1a-d2c/RM70F91RM94U1A/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a419b664ab80f759a387', 'REFRIGERATOR', '삼성', 'RM80F6442XJ', ARRAY[]::TEXT[], 'Bespoke AI 냉장고+김치플러스 4도어 키친핏 Max 611/418L', 912, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm80f6442xj-d2c/RM80F6442XJ/","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1e11a394a33bece00a3c', 'REFRIGERATOR', '삼성', 'RM80F91K17955X', ARRAY[]::TEXT[], 'Bespoke AI 하이브리드 냉장고 4도어+냉동고 1도어 키친핏 889/347L', 912, 1853, 930, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm80f91k17955x-d2c/RM80F91K17955X/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_29b2ff6db5ca53b3a865', 'REFRIGERATOR', '삼성', 'RM90R294U1ZDRQ', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 4도어+김치플러스 4도어 905/583L', 912, 1830, 922, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rm90r294u1zdrq-d2c/RM90R294U1ZDRQ/","value":{"widthMm":912,"heightMm":1830,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a8aeed53a31534334f96', 'REFRIGERATOR', '삼성', 'RR39A7695A01FK', ARRAY[]::TEXT[], 'Bespoke 냉장고 1도어 키친핏 380L (좌열림/열림방향 가변, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr39a7695a01fk-d2c/RR39A7695A01FK/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_bf1201bc04515e6498e4', 'REFRIGERATOR', '삼성', 'RR40C7885AP01', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 1도어 키친핏 409L (우열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c7885ap01-d2c/RR40C7885AP01/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5818e2da54ca11074514', 'REFRIGERATOR', '삼성', 'RR40C78RZRQ79A', ARRAY[]::TEXT[], 'Bespoke AI 냉장고+냉동고+김치플러스 1도어 키친핏 409/347/347L', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c78rzrq79a-d2c/RR40C78RZRQ79A/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_943f28e7586596e27f3c', 'REFRIGERATOR', '삼성', 'RR40C790578001', ARRAY[]::TEXT[], 'Bespoke AI 냉동고+냉장고+김치플러스 1도어 키친핏 347/409/348L', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c790578001--d2c/RR40C790578001/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d01e0108fd84d5b04da5', 'REFRIGERATOR', '삼성', 'RR40C79057801', ARRAY[]::TEXT[], 'Bespoke AI 냉동고+냉장고+김치플러스 1도어 키친핏 347/409/348L', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c79057801-d2c/RR40C79057801/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d4b0a5150eeda0c02d23', 'REFRIGERATOR', '삼성', 'RR40C79057915A', ARRAY[]::TEXT[], 'Bespoke AI 냉장고+김치플러스 1도어 키친핏 409/348L', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c79057915a-d2c/RR40C79057915A/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9c0e1e2fd3098a3422e2', 'REFRIGERATOR', '삼성', 'RR40C7985AP01', ARRAY[]::TEXT[], 'Bespoke AI 냉장고 1도어 키친핏 409L (좌열림, 냉장전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c7985ap01-d2c/RR40C7985AP01/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_24754e3efe1ff57eec5b', 'REFRIGERATOR', '삼성', 'RR40C8995AW6FK', ARRAY[]::TEXT[], 'Infinite AI 냉장고 1도어 키친핏 408L (좌열림, 냉장전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c8995aw6fk-d2c/RR40C8995AW6FK/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_995504d21ad1bccbfee2', 'REFRIGERATOR', '삼성', 'RR40C9981APGW6', ARRAY[]::TEXT[], 'Infinite AI 정수기 냉장고 1도어 키친핏 386L+수납존', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rr40c9981apgw6-d2c/RR40C9981APGW6/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9da38caf4a24c7775a55', 'REFRIGERATOR', '삼성', 'RS80F64J3F01', ARRAY[]::TEXT[], '양문형 냉장고 623L+교체형 정수필터 2개', 912, 1786, 716, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rs80f64j3f01-d2c/RS80F64J3F01/","value":{"widthMm":912,"heightMm":1786,"depthMm":716}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4fd9c3f7c4eb52f5178d', 'REFRIGERATOR', '삼성', 'RZ24A5660A01FK', ARRAY[]::TEXT[], 'Bespoke 변온 냉동고 1도어 키친핏 240L (우열림/열림방향 가변)', 455, 1853, 685, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz24a5660a01fk-d2c/RZ24A5660A01FK/","value":{"widthMm":455,"heightMm":1853,"depthMm":685}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_68521d2d285f772b5efe', 'REFRIGERATOR', '삼성', 'RZ24C58G0A01FK', ARRAY[]::TEXT[], 'Bespoke AI 변온 냉동고 1도어 키친핏 240L (우열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz24c58g0a01fk-d2c/RZ24C58G0A01FK/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e682f863a06374e72903', 'REFRIGERATOR', '삼성', 'RZ24C59G001RC', ARRAY[]::TEXT[], 'Bespoke AI 변온 냉동고 1도어 키친핏 240L (좌열림)', 455, 1853, 638, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz24c59g001rc-d2c/RZ24C59G001RC/","value":{"widthMm":455,"heightMm":1853,"depthMm":638}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6e15ccf40c44145adcc7', 'REFRIGERATOR', '삼성', 'RZ32A7665A01FK', ARRAY[]::TEXT[], 'Bespoke 냉동고 1도어 키친핏 318L (우열림/열림방향 가변, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz32a7665a01fk-d2c/RZ32A7665A01FK/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a369cf31757a3e371b29', 'REFRIGERATOR', '삼성', 'RZ34C7855AP01', ARRAY[]::TEXT[], 'Bespoke AI 냉동고 1도어 키친핏 347L (우열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz34c7855ap01-d2c/RZ34C7855AP01/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4e7318fb2a5a6e31f5ac', 'REFRIGERATOR', '삼성', 'RZ34C7955AP01', ARRAY[]::TEXT[], 'Bespoke AI 냉동고 1도어 키친핏 347L (좌열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz34c7955ap01-d2c/RZ34C7955AP01/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3e0f4580995ce52bfbf7', 'REFRIGERATOR', '삼성', 'RZ34C7965AP01', ARRAY[]::TEXT[], 'Bespoke AI 냉동고 1도어 키친핏 347L (좌열림, 냉동전용)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz34c7965ap01-d2c/RZ34C7965AP01/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_113dbfc3f63f70de5818', 'REFRIGERATOR', '삼성', 'RZ34C8865AW6FK', ARRAY[]::TEXT[], 'Infinite AI 냉동고 1도어 키친핏 347L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz34c8865aw6fk-d2c/RZ34C8865AW6FK/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1a5f31cd28f9fa45a6e9', 'REFRIGERATOR', '삼성', 'RZ38C9891APGW6', ARRAY[]::TEXT[], 'Infinite AI 냉동고 1도어 키친핏 379L (우열림, 냉동전용)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/package-rz38c9891apgw6-d2c/RZ38C9891APGW6/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_54d077e6f38d939d53f5', 'REFRIGERATOR', '삼성', 'RS70F65Q2F', ARRAY[]::TEXT[], '양문형 냉장고 651L', 912, 1786, 716, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs70f65q2f-d2c/RS70F65Q2F/","value":{"widthMm":912,"heightMm":1786,"depthMm":716}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9c656d725b229b856f75', 'REFRIGERATOR', '삼성', 'RS70F65Q2Y', ARRAY[]::TEXT[], 'Bespoke 양문형 냉장고 651L', 912, 1786, 716, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs70f65q2y-d2c/RS70F65Q2Y/","value":{"widthMm":912,"heightMm":1786,"depthMm":716}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c2d03ca3213f0ac51d89', 'REFRIGERATOR', '삼성', 'RS80F64J3F', ARRAY[]::TEXT[], '양문형 냉장고 623L (오토오픈도어)', 912, 1786, 716, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs80f64j3f-d2c/RS80F64J3F/","value":{"widthMm":912,"heightMm":1786,"depthMm":716}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_134746df2f5882700b1f', 'REFRIGERATOR', '삼성', 'RS82M6000S8', ARRAY[]::TEXT[], '양문형 냉장고 815 L', 912, 1779, 907, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs82m6000s8-d2c/RS82M6000S8/","value":{"widthMm":912,"heightMm":1779,"depthMm":907}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_51e5fcc971ab947e5423', 'REFRIGERATOR', '삼성', 'RS84DG5002M9', ARRAY[]::TEXT[], '양문형 냉장고 852L', 912, 1780, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84db5002m9-d2c/RS84DG5002M9/","value":{"widthMm":912,"heightMm":1780,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a9035cff049b69977ed5', 'REFRIGERATOR', '삼성', 'RS84DG5002WW', ARRAY[]::TEXT[], '양문형 냉장고 852L', 912, 1780, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84db5002ww-d2c/RS84DG5002WW/","value":{"widthMm":912,"heightMm":1780,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_deeae4392ab9d454f81a', 'REFRIGERATOR', '삼성', 'RS84DB5602CW', ARRAY[]::TEXT[], 'Bespoke  양문형 냉장고 846L (오토오픈도어)', 912, 1786, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84db5602cw-d2c/RS84DB5602CW/","value":{"widthMm":912,"heightMm":1786,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_93422c0593bc55915ebb', 'REFRIGERATOR', '삼성', 'RS84DG5022B4', ARRAY[]::TEXT[], '양문형 냉장고 852L (메탈쿨링커버)', 912, 1780, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84dg5022b4-d2c/RS84DG5022B4/","value":{"widthMm":912,"heightMm":1780,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6f4ace5b4369abb20fad', 'REFRIGERATOR', '삼성', 'RS84DG5202B4', ARRAY[]::TEXT[], '양문형 냉장고 852L (오토오픈도어)', 912, 1786, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84dg5202b4-d2c/RS84DG5202B4/","value":{"widthMm":912,"heightMm":1786,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8f0ea75317ebe6d9162c', 'REFRIGERATOR', '삼성', 'RS84DG5602M9', ARRAY[]::TEXT[], '양문형 냉장고 846L (오토오픈도어)', 912, 1786, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84dg5602m9-d2c/RS84DG5602M9/","value":{"widthMm":912,"heightMm":1786,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_90c7abd75cb9d220967b', 'REFRIGERATOR', '삼성', 'RT25BAR41WW', ARRAY[]::TEXT[], '냉장고 255L', 555, 1635, 637, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-freezer-rt25bar41ww-d2c/RT25BAR41WW/","value":{"widthMm":555,"heightMm":1635,"depthMm":637}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3ceafd44f860859ba378', 'REFRIGERATOR', '삼성', 'RT19T3007GS', ARRAY[]::TEXT[], '냉장고 203L', 555, 1445, 637, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt19t3007gs-d2c/RT19T3007GS/","value":{"widthMm":555,"heightMm":1445,"depthMm":637}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5fb44a63cf6331de8f43', 'REFRIGERATOR', '삼성', 'RT20FARL3S9', ARRAY[]::TEXT[], '냉장고 203L', 555, 1445, 637, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt20farl3s9-d2c/RT20FARL3S9/","value":{"widthMm":555,"heightMm":1445,"depthMm":637}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_54db7c499556868a2fec', 'REFRIGERATOR', '삼성', 'RT25DARAHS9', ARRAY[]::TEXT[], '냉장고 255L', 555, 1635, 637, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt25darahs9-d2c/RT25DARAHS9/","value":{"widthMm":555,"heightMm":1635,"depthMm":637}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e0632683c8fd36f52dab', 'REFRIGERATOR', '삼성', 'RT25FARA2S9', ARRAY[]::TEXT[], '냉장고 255L', 555, 1635, 637, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt25fara2s9-d2c/RT25FARA2S9/","value":{"widthMm":555,"heightMm":1635,"depthMm":637}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ba777de5e5c700e0dccd', 'REFRIGERATOR', '삼성', 'RT25NARAHS8', ARRAY[]::TEXT[], '냉장고 255L', 555, 1635, 637, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt25narahs8-d2c/RT25NARAHS8/","value":{"widthMm":555,"heightMm":1635,"depthMm":637}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f80b491a9515d99cd370', 'REFRIGERATOR', '삼성', 'RT31CB5624C3', ARRAY[]::TEXT[], '냉장고 298L', 600, 1715, 647, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt31cb5624c3-d2c/RT31CB5624C3/","value":{"widthMm":600,"heightMm":1715,"depthMm":647}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2b76357b56e7bff60772', 'REFRIGERATOR', '삼성', 'RT31CG5624S9', ARRAY[]::TEXT[], '냉장고 298L', 600, 1715, 647, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt31cg5624s9-d2c/RT31CG5624S9/","value":{"widthMm":600,"heightMm":1715,"depthMm":647}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5c15c1afbe73e5a1485d', 'REFRIGERATOR', '삼성', 'RT42CG6024S9', ARRAY[]::TEXT[], '냉장고 410L', 700, 1785, 672, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt42cg6024s9-d2c/RT42CG6024S9/","value":{"widthMm":700,"heightMm":1785,"depthMm":672}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cb0a0c2e4aa5f56dd927', 'REFRIGERATOR', '삼성', 'RT50T6035WW', ARRAY[]::TEXT[], '냉장고 499 L', 790, 1785, 720, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt50t6035ww-N/RT50T6035WW/","value":{"widthMm":790,"heightMm":1785,"depthMm":720}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0b92ccef84425f9b4fe3', 'REFRIGERATOR', '삼성', 'RT53DB7A1CET', ARRAY[]::TEXT[], '냉장고 525L', 790, 1855, 725, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt53db7a1cet-d2c/RT53DB7A1CET/","value":{"widthMm":790,"heightMm":1855,"depthMm":725}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_73f8dae2dc42c9ae496f', 'REFRIGERATOR', '삼성', 'RT53DG7A1CWW', ARRAY[]::TEXT[], '냉장고 525L', 790, 1855, 725, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt53dg7a1cww-d2c/RT53DG7A1CWW/","value":{"widthMm":790,"heightMm":1855,"depthMm":725}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5cef97a907da4f1022b1', 'REFRIGERATOR', '삼성', 'RT62A7049S9', ARRAY[]::TEXT[], '냉장고 615L', 836, 1862, 788, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rt62a7049s9-n/RT62A7049S9/","value":{"widthMm":836,"heightMm":1862,"depthMm":788}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_33a8160167c1bf5cf886', 'REFRIGERATOR', '삼성', 'RZ22CG4000WW', ARRAY[]::TEXT[], '냉동고 227L (냉동전용)', 595, 1720, 590, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/top-mount-freezer-rz22cg4000ww-d2c/RZ22CG4000WW/","value":{"widthMm":595,"heightMm":1720,"depthMm":590}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6b55d3ed78336218246c', 'REFRIGERATOR', 'LG', 'A202S', ARRAY[]::TEXT[], 'LG 냉동고', 600, 629, 1383, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/a202s","value":{"widthMm":600,"heightMm":629,"depthMm":1383}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a4e0d7ff634e07b69ecb', 'REFRIGERATOR', 'LG', 'B053S14', ARRAY[]::TEXT[], 'LG 일반냉장고', 443, 450, 501, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/b053s14","value":{"widthMm":443,"heightMm":450,"depthMm":501}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_589ec532c08ac87b748e', 'REFRIGERATOR', 'LG', 'B103S14', ARRAY[]::TEXT[], 'LG 일반냉장고', 463, 482, 820, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/b103s14","value":{"widthMm":463,"heightMm":482,"depthMm":820}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b4a737a1530fcdc434ef', 'REFRIGERATOR', 'LG', 'B182W13', ARRAY[]::TEXT[], 'LG 일반냉장고', 555, 585, 1400, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/b182w13","value":{"widthMm":555,"heightMm":585,"depthMm":1400}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8d848f88fba1f52c1ab3', 'REFRIGERATOR', 'LG', 'B312W31', ARRAY[]::TEXT[], 'LG 일반냉장고', 600, 710, 1640, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/b312w31","value":{"widthMm":600,"heightMm":710,"depthMm":1640}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7980ff5a0b274499c685', 'REFRIGERATOR', 'LG', 'B502S33', ARRAY[]::TEXT[], 'LG 일반냉장고', 780, 730, 1800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/b502s33","value":{"widthMm":780,"heightMm":730,"depthMm":1800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_80f8acc5af3476864673', 'REFRIGERATOR', 'LG', 'B502S53', ARRAY[]::TEXT[], 'LG 일반냉장고', 780, 730, 1800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/b502s53","value":{"widthMm":780,"heightMm":730,"depthMm":1800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4ad96c703de836d70800', 'REFRIGERATOR', 'LG', 'D312MBE31', ARRAY[]::TEXT[], 'LG 일반냉장고 오브제컬렉션', 600, 710, 1640, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/d312mbe31","value":{"widthMm":600,"heightMm":710,"depthMm":1640}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a1e270b21e59d2b077db', 'REFRIGERATOR', 'LG', 'D332MBE34', ARRAY[]::TEXT[], 'LG 일반냉장고 오브제컬렉션', 600, 710, 1720, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/d332mbe34","value":{"widthMm":600,"heightMm":710,"depthMm":1720}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6f2f9db90f96801868f2', 'REFRIGERATOR', 'LG', 'D463MRR33', ARRAY[]::TEXT[], 'LG 일반냉장고 오브제컬렉션', 700, 725, 1845, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/d463mrr33","value":{"widthMm":700,"heightMm":725,"depthMm":1845}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7649ff5fc7d9dfe3fc07', 'REFRIGERATOR', 'LG', 'D502MEE33', ARRAY[]::TEXT[], 'LG 일반냉장고 오브제컬렉션', 780, 730, 1800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/d502mee33","value":{"widthMm":780,"heightMm":730,"depthMm":1800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_be2ed637fb52851e820a', 'REFRIGERATOR', 'LG', 'D502MEE53', ARRAY[]::TEXT[], 'LG 일반냉장고 오브제컬렉션', 780, 730, 1800, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/d502mee53","value":{"widthMm":780,"heightMm":730,"depthMm":1800}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c4c9ef83bc4cadfc8c59', 'REFRIGERATOR', 'LG', 'F904ND79E', ARRAY[]::TEXT[], 'LG SIGNATURE 상냉장고', 912, 929, 1784, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/f904nd79e","value":{"widthMm":912,"heightMm":929,"depthMm":1784}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0193fdf7d8065b66f59f', 'REFRIGERATOR', 'LG', 'H875GBB012', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 베이직 냉장고', 914, 918, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/h875gbb012","value":{"widthMm":914,"heightMm":918,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ecb4e4c5e539abcc44a3', 'REFRIGERATOR', 'LG', 'M301S31', ARRAY[]::TEXT[], 'LG 모던엣지 냉장고', 595, 677, 1720, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/m301s31","value":{"widthMm":595,"heightMm":677,"depthMm":1720}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4e6faab20ad17e9635c2', 'REFRIGERATOR', 'LG', 'M402ND', ARRAY[]::TEXT[], 'LG SIGNATURE 냉장고', 700, 735, 1793, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/m402nd","value":{"widthMm":700,"heightMm":735,"depthMm":1793}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ad9c428da97ba6be6f1f', 'REFRIGERATOR', 'LG', 'M616GBB0M1', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 냉장고 Fit & Max', 914, 698, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/m616gbb0m1","value":{"widthMm":914,"heightMm":698,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_22eea28ae25f6e0011ab', 'REFRIGERATOR', 'LG', 'M616MQQ0M1', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 냉장고 Fit & Max', 914, 698, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/m616mqq0m1","value":{"widthMm":914,"heightMm":698,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_26112c4e61356bfb0ff5', 'REFRIGERATOR', 'LG', 'M626GBB032', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 냉장고 Fit & Max', 914, 698, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/m626gbb032","value":{"widthMm":914,"heightMm":698,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b3952135b92dfde870ea', 'REFRIGERATOR', 'LG', 'M876GBB231', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 냉장고 (더블매직스페이스)', 914, 918, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/m876gbb231","value":{"widthMm":914,"heightMm":918,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_295ba32b88990af916ac', 'REFRIGERATOR', 'LG', 'Q342GBB133S', ARRAY[]::TEXT[], 'LG 모던엣지 냉장고 오브제컬렉션', 595, 676, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/q342gbb133s","value":{"widthMm":595,"heightMm":676,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1138d56df40905d4327d', 'REFRIGERATOR', 'LG', 'Q342GBB153', ARRAY[]::TEXT[], 'LG 모던엣지 냉장고 오브제컬렉션', 595, 676, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/q342gbb153","value":{"widthMm":595,"heightMm":676,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cc76fe48b04dcc16a6cc', 'REFRIGERATOR', 'LG', 'Q343GIC183S', ARRAY[]::TEXT[], 'LG 모던엣지 냉장고 오브제컬렉션 노크온', 595, 676, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/q343gic183s","value":{"widthMm":595,"heightMm":676,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8864bcd763f411d76ea8', 'REFRIGERATOR', 'LG', 'Q343MEEF53', ARRAY[]::TEXT[], 'LG 모던엣지 냉장고 오브제컬렉션', 595, 676, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/q343meef53","value":{"widthMm":595,"heightMm":676,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0e71d2a1825d2c1452f7', 'REFRIGERATOR', 'LG', 'Q343MHHF33', ARRAY[]::TEXT[], 'LG 모던엣지 냉장고 오브제컬렉션', 595, 676, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/q343mhhf33","value":{"widthMm":595,"heightMm":676,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d1b2b0949e4c37750e4a', 'REFRIGERATOR', 'LG', 'S834MEE111', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 냉장고 (양문형, 매직스페이스)', 913, 913, 1790, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/s834mee111","value":{"widthMm":913,"heightMm":913,"depthMm":1790}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3acea1d54ba777bb01b1', 'REFRIGERATOR', 'LG', 'S834MTE011', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 냉장고 (양문형)', 913, 913, 1790, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/s834mte011","value":{"widthMm":913,"heightMm":913,"depthMm":1790}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ce1a7b11fc3876d1ae2c', 'REFRIGERATOR', 'LG', 'S836MEE022', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 냉장고 (양문형)', 913, 1790, 913, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/s836mee022","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_890883f55cba408eeab1', 'REFRIGERATOR', 'LG', 'T875MEE011', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 베이직 냉장고', 914, 918, 1787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/t875mee011","value":{"widthMm":914,"heightMm":918,"depthMm":1787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_39a16c6fc293926607b4', 'REFRIGERATOR', 'LG', 'W826GBB482', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 STEM 얼음정수 냉장고 (노크온 매직스페이스)', 914, 918, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/w826gbb482","value":{"widthMm":914,"heightMm":918,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b54f2c386a6ec68a20fa', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34A7845AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 1도어 키친핏 347L (우열림, 오토오픈도어, UV탈취)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/RQ34A7845AP/RQ34A7845AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0e0ab30d9a84cc37e30f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42B99T1W5G', ARRAY[]::TEXT[], 'Infinite Line 김치플러스 4도어 키친핏 420L (글래스 쿨링커버)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/RQ42B99T1W5G/RQ42B99T1W5G/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4911c3864f1989dd980f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ22K5R01EC', ARRAY[]::TEXT[], '빌트인 김치냉장고 220 L', 557, 1780, 550, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/builtin-kimchi-refrigerators-rq22k5r01ec/RQ22K5R01EC/","value":{"widthMm":557,"heightMm":1780,"depthMm":550}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8390a99096b61bdf9332', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB9431AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 487L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-RQ49DB9431AP-d2c/RQ49DB9431AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7d023856141f5247e924', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F42F2X', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 Max 420L (냄새케어 김치통)', 799, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f42f2x-d2c/RK70F42F2X/","value":{"widthMm":799,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6cae3c612d2b1e2b5e8d', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F42M3Z', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 Max 420L', 799, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f42m3z-d2c/RK70F42M3Z/","value":{"widthMm":799,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d887bfa7ed18da94599c', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F49D1A', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 487L (맞춤숙성실)', 799, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f49d1a-d2c/RK70F49D1A/","value":{"widthMm":799,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_be1bfe748242439f6328', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F49F1DD', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (냄새케어 김치통)', 799, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f49f1dd-d2c/RK70F49F1DD/","value":{"widthMm":799,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a7534356b6334bf8aef5', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F49F1X', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (냄새케어 김치통)', 799, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f49f1x-d2c/RK70F49F1X/","value":{"widthMm":799,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e74b1b9e4e680284d051', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F49M1A', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L', 799, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f49m1a-d2c/RK70F49M1A/","value":{"widthMm":799,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ee7abba464fdd09a95f7', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F49M2ZD', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L', 799, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f49m2zd-d2c/RK70F49M2ZD/","value":{"widthMm":799,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6aa0f5e7773404ca00c1', 'KIMCHI_REFRIGERATOR', '삼성', 'RK70F58M1ZG', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 586L', 799, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk70f58m1zg-d2c/RK70F58M1ZG/","value":{"widthMm":799,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4190068946c06c46ad4a', 'KIMCHI_REFRIGERATOR', '삼성', 'RK80F42C2A', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 Max 418L (맞춤숙성실)', 799, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk80f42c2a-d2c/RK80F42C2A/","value":{"widthMm":799,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a155811e5813194a4960', 'KIMCHI_REFRIGERATOR', '삼성', 'RK80F42E2A', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 Max 420L (메탈쿨링 선반)', 799, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk80f42e2a-d2c/RK80F42E2A/","value":{"widthMm":799,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d0a34052b74ce9ff5eea', 'KIMCHI_REFRIGERATOR', '삼성', 'RK80F49C1W', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 487L (맞춤숙성실)', 799, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk80f49c1w-d2c/RK80F49C1W/","value":{"widthMm":799,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_03e5556041ff65f2afe9', 'KIMCHI_REFRIGERATOR', '삼성', 'RK80F49E1A', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (메탈쿨링 선반)', 799, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk80f49e1a-d2c/RK80F49E1A/","value":{"widthMm":799,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8cf2ed458d9952ffb5d9', 'KIMCHI_REFRIGERATOR', '삼성', 'RK80F58B1A', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 583L (냄새케어 메탈쿨링 김치통)', 799, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rk80f58b1a-d2c/RK80F58B1A/","value":{"widthMm":799,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_778ae5bc1c06ed7433be', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ32C7612AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 319L (우열림/열림방향가변)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq32c7612ap-d2c/RQ32C7612AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0dcf4fd00d22744813fa', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ32C76A2AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 319L (우열림/열림방향가변)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq32c76a2ap-d2c/RQ32C76A2AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1351d9414c3c9b1a91c2', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33C7411AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33c7411ap-d2c/RQ33C7411AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a275691fbfd1a2b18db7', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33C7441AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33c7441ap-d2c/RQ33C7441AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0cafd3ddef5f2d79d07f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33C74C3AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33c74c3ap-d2c/RQ33C74C3AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7a5c91a80af17e7e08f2', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33C74E1AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33c74e1ap-d2c/RQ33C74E1AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c3dab1ce37f729f82bd9', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB7411AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db7411ap-d2c/RQ33DB7411AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_bdf269387f2d9891dbd8', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB7411EW', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db7411ew-d2c/RQ33DB7411EW/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_451c575193c5ee152d60', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB7441AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db7441ap-d2c/RQ33DB7441AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b7e7137a3bf3d758b17f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB74B1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db74b1ap-d2c/RQ33DB74B1AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b3a147138fd2a0f3a6c1', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB74C1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db74c1ap-d2c/RQ33DB74C1AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_77e77c650cc576b2a43c', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB74D2AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db74d2ap-d2c/RQ33DB74D2AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b4f21bf23bf40a46b835', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB74E1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33db74e1ap-d2c/RQ33DB74E1AP/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_449bf6eab4caf438e106', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DG71J2EW', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 328L', 693, 1797, 649, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq33dg71j2ew-d2c/RQ33DG71J2EW/","value":{"widthMm":693,"heightMm":1797,"depthMm":649}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7736a131bc9333b5d211', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34C7815AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 348L (우열림)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq34c7815ap-d2c/RQ34C7815AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3efb37ca1fa2e8b5336d', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34C7845AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 347L (우열림)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq34c7845ap-d2c/RQ34C7845AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c9eb2875cb79efa2753f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42A94B1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42a94b1ap-d2c/RQ42A94B1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_082031de41dc974905a5', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42A94C1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L (글래스 쿨링커버)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42a94c1ap-d2c/RQ42A94C1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8210da231666ba0bd86d', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42A94F1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42a94f1ap-d2c/RQ42A94F1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4028d6fe919be21706e4', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42A94G2AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42a94g2ap-d2c2/RQ42A94G2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_43c3d7f52de8ee80c660', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42A94J1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42a94j1ap-d2c/RQ42A94J1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a0d3f49388b103109e21', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42B99T1APG', ARRAY[]::TEXT[], 'Infinite Line 김치플러스 4도어 키친핏 420L (글래스 쿨링커버)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42b99t1apg-d2c/RQ42B99T1APG/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d175f115770e77b74463', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42B99T1APK', ARRAY[]::TEXT[], 'Infinite Line 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42b99t1apk-d2c/RQ42B99T1APK/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ac4782ddbba69e4e877d', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42C94A2AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L (글래스 쿨링커버)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42c94a2ap-d2c/RQ42C94A2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_161e960b3b803c5b1d26', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42C94G2AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42c94g2ap-d2c/RQ42C94G2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_13e875a33ebf0736c2fc', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42C94J2AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 키친핏 420L', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42c94j2ap-d2c/RQ42C94J2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a3692753d65496bb772c', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42C94Q2AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 418L (맞춤숙성실)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42c94q2ap-d2c/RQ42C94Q2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_330a6eadc14a16e473fe', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42C99T2APG', ARRAY[]::TEXT[], 'Infinite Line 김치플러스 4도어 키친핏 420L (글래스 쿨링커버)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42c99t2apg-d2c/RQ42C99T2APG/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d36cf006bef5a321920b', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42DB94J2AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 420L (AI 정온 모드)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42db94j2ap-d2c/RQ42DB94J2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f4725c4fae9347dbe004', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42DB94L3AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 420L (AI 정온 모드)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42db94l3ap-d2c/RQ42DB94L3AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6ad9be9b30c4bb9e6223', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42DB94Q2AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 418L (AI 정온 모드)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42db94q2ap-d2c/RQ42DB94Q2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9084d0357ff3cab2c50a', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42DB94R2AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 키친핏 420L (AI 정온 모드)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42db94r2ap-d2c/RQ42DB94R2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f42987e2ecca17a31de7', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42DB99T2APG', ARRAY[]::TEXT[], 'Infinite AI 김치플러스 4도어 키친핏 418L (AI 정온 모드)', 795, 1853, 697, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42db99t2apg-d2c/RQ42DB99T2APG/","value":{"widthMm":795,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_551a14b3229d49c0234b', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48A9003S9', ARRAY[]::TEXT[], '김치플러스 4도어 490L', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48a9003s9-d2c/RQ48A9003S9/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_466a3d1e77c11ee65feb', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48A9402AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48a9402ap-d2c/RQ48A9402AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_713a092715b1d415e8d0', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48A9421AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L (메탈김치통 포함)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48a9421ap-d2c/RQ48A9421AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_810fd9322f606cb7b395', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48A94W1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48a94w1ap-d2c/RQ48A94W1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2a86e633cea0440b5cc9', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48A94Y126', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 프리스탠딩 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48a94y1s9-d2c/RQ48A94Y126/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_45accc1bdf2d6bf505fb', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48B94M1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48b94m1ap-d2c2/RQ48B94M1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5517598e226f87a519a7', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C9001S9', ARRAY[]::TEXT[], '김치플러스 4도어 490L', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c9001s9-d2c/RQ49C9001S9/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e80872a32da629895b90', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C9003S9', ARRAY[]::TEXT[], '김치플러스 4도어 490L', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c9003s9-d2c/RQ49C9003S9/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f6c9bd7ff28dba83be76', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C90X24W', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c90x24w-d2c/RQ49C90X24W/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_52afb65c015146595779', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C9401H6', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c9401ap-d2c/RQ49C9401H6/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_81dec3c50f5fe2d1dde5', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C940201', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c9402ap-d2c/RQ49C940201/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_599c31632b9dbc23de4f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C9431AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L (메탈김치통 포함)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c9431ap-d2c/RQ49C9431AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c406276c478acf68dc41', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C94R1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 490L', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c94r1ap-d2c/RQ49C94R1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_42e06b4ec2c39b4110c0', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB9401AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49db9401ap-d2c/RQ49DB9401AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5023e1c6c09d7cfdd154', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB9402AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49db9402ap-d2c/RQ49DB9402AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e1c6c85376629197350a', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB9421AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49db9421ap-d2c/RQ49DB9421AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_754d49cc261c38f3fbbc', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB94H2AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49db94h2ap-d2c/RQ49DB94H2AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ca71fc3e482458e85309', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB94Y1AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49db94y1ap-d2c/RQ49DB94Y1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_17a9fece172778aab460', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DG9001S9', ARRAY[]::TEXT[], 'AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49dg9001s9-d2c/RQ49DG9001S9/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5dcd3cf6e735f91303be', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DG9002S9', ARRAY[]::TEXT[], 'AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49dg9002s9-d2c/RQ49DG9002S9/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8f077701c7c4a47c10dd', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DG9003S9', ARRAY[]::TEXT[], 'AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1825, 787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49dg9003s9-d2c/RQ49DG9003S9/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_319ec2c49f1a7bd957bd', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58A9471AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 586L', 795, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq58a9471ap-d2c2/RQ58A9471AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_908134394b5b980a6c7b', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58C9452AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 586L', 795, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq58c9452ap-d2c/RQ58C9452AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5b591d75a7bf0b174a9e', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58C94N1AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 4도어 586L', 795, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq58c94n1ap-d2c/RQ58C94N1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_74403ff96e85a658d644', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58DB9471AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 583L (AI 정온 모드)', 795, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq58db9471ap-d2c/RQ58DB9471AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_39b23c42a6027a43a23e', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58DB94U1AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 583L (AI 정온 모드)', 795, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq58db94u1ap-d2c/RQ58DB94U1AP/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0b4c381c9bac17b9621f', 'KIMCHI_REFRIGERATOR', '삼성', 'RP13C1022S9', ARRAY[]::TEXT[], '김치플러스 뚜껑형 126L', 650, 920, 575, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loading-rp13c1022s9-d2c/RP13C1022S9/","value":{"widthMm":650,"heightMm":920,"depthMm":575}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_dacacfbf45a36b6cd9e3', 'KIMCHI_REFRIGERATOR', '삼성', 'RP20C32417Z', ARRAY[]::TEXT[], '김치플러스 뚜껑형 202L (5면 메탈쿨링)', 925, 923, 702, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loading-rp20c32417z-d2c/RP20C32417Z/","value":{"widthMm":925,"heightMm":923,"depthMm":702}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c4af8bbc6376b5f0d6bf', 'KIMCHI_REFRIGERATOR', '삼성', 'RP22C31A1EG', ARRAY[]::TEXT[], '김치플러스 뚜껑형 221L', 925, 973, 702, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loading-rp22c31a1eg-d2c/RP22C31A1EG/","value":{"widthMm":925,"heightMm":973,"depthMm":702}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9ea2dba3a8bec0f5b750', 'KIMCHI_REFRIGERATOR', '삼성', 'RP22C3231Z3', ARRAY[]::TEXT[], '김치플러스 뚜껑형 221L (5면 메탈쿨링)', 925, 973, 702, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loading-rp22c3231z3-d2c/RP22C3231Z3/","value":{"widthMm":925,"heightMm":973,"depthMm":702}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4ba77d1ac8971dfb44d2', 'KIMCHI_REFRIGERATOR', '삼성', 'RP20C3111EG', ARRAY[]::TEXT[], '김치플러스 뚜껑형 202L', 925, 923, 702, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loadingrp20c3111eg-d2c/RP20C3111EG/","value":{"widthMm":925,"heightMm":923,"depthMm":702}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a463c19d2754c1f39e93', 'KIMCHI_REFRIGERATOR', '삼성', 'RP22C3111Z1', ARRAY[]::TEXT[], '김치플러스 뚜껑형 221L', 925, 973, 702, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loadingrp22c3111z1-d2c/RP22C3111Z1/","value":{"widthMm":925,"heightMm":973,"depthMm":702}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e76c62051dcdff9535e7', 'KIMCHI_REFRIGERATOR', '삼성', 'RP22C3531CE', ARRAY[]::TEXT[], '김치플러스 뚜껑형 221L (5면 메탈쿨링)', 925, 973, 702, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-top-loadingrp22c33531c0-d2c/RP22C3531CE/","value":{"widthMm":925,"heightMm":973,"depthMm":702}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a11481583eec0d3ecb22', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ32C7645AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 319L (우열림/열림방향가변)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq32c7645ap-d2c/RQ32C7645AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a3b306a4095f9766b7cf', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34A7915AP', ARRAY[]::TEXT[], 'Bespoke 김치냉장고 1도어 348L (우힌지, 우개폐)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq34a7915ap-d2c2/RQ34A7915AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_57e7becd67829ecdee9d', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34A7835AP', ARRAY[]::TEXT[], 'Bespoke 김치플러스 1도어 키친핏 347L (우열림, 오토오픈도어, UV탈취)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq34a7935ap-d2c/RQ34A7835AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_11e34305fc547f3c89ae', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34C8945APG', ARRAY[]::TEXT[], 'Infinite AI 김치플러스 1도어 키친핏 347L (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq34b8945ap-d2c/RQ34C8945APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cda0d0012de53786676f', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34C7835AP', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 347L (우열림)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq34c7835ap-d2c/RQ34C7835AP/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_68d095bdcb502df9b994', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ38C9991APG', ARRAY[]::TEXT[], 'Infinite AI 김치플러스 1도어 키친핏 404L (좌열림)', 595, 1855, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq38c9991apg-d2c/RQ38C9991APG/","value":{"widthMm":595,"heightMm":1855,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_02ef9a3143edecf8df1b', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ70H32R10', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 319L (우열림/열림방향가변)', 595, 1858, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/one-door-rq70h32r10-d2c/RQ70H32R10/","value":{"widthMm":595,"heightMm":1858,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d1447442314c17fb7a0b', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB7441APGD', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq33db7441apgd-d2c/RQ33DB7441APGD/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4beb07a3201430f1b727', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB74B1GD', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq33db74b1gd-d2c/RQ33DB74B1GD/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4be13d06997baef2fdca', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ33DB74D2GD', ARRAY[]::TEXT[], 'Bespoke 김치플러스 3도어 키친핏 313L', 695, 1853, 600, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq33db74d2gd-d2c/RQ33DB74D2GD/","value":{"widthMm":695,"heightMm":1853,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2ea4e516437b6f2c8c2d', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34C7835APGD', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 347L (우열림)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq34c7835apgd-d2c/RQ34C7835APGD/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_65e8db58c5b1d7ef5edf', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ34C7915APGD', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 1도어 키친핏 348L (좌열림)', 595, 1853, 688, NULL, NULL, NULL, NULL, NULL, NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq34c7915apgd-d2c/RQ34C7915APGD/","value":{"widthMm":595,"heightMm":1853,"depthMm":688}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d36cfc24083578a6a624', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB9421WSD', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq49db9421wsd-d2c/RQ49DB9421WSD/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_eeb4f193ba326b99edda', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DB94H2WSD', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 490L (AI 정온 모드)', 795, 1853, 794, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq49db94h2wsd-d2c/RQ49DB94H2WSD/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_861898c33d00eb454a75', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58DB9471WS', ARRAY[]::TEXT[], 'Bespoke AI 김치플러스 4도어 583L (AI 정온 모드)', 795, 1853, 892, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/kimchi-refrigerators/package-rq58db9471ws-d2c/RQ58DB9471WS/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8a7c2c579cf86a4841a3', 'KIMCHI_REFRIGERATOR', 'LG', 'K135LW123', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡', 666, 612, 900, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/k135lw123","value":{"widthMm":666,"heightMm":612,"depthMm":900}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fd22152fbaa19196089f', 'KIMCHI_REFRIGERATOR', 'LG', 'K220S111', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡', 920, 691, 949, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/k220s111","value":{"widthMm":920,"heightMm":691,"depthMm":949}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_33fac1dff2b2ed259512', 'KIMCHI_REFRIGERATOR', 'LG', 'K225LW121', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡', 920, 691, 949, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/k225lw121","value":{"widthMm":920,"heightMm":691,"depthMm":949}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c06f411478b13a0550a5', 'KIMCHI_REFRIGERATOR', 'LG', 'K225MB131', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡', 920, 691, 949, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/k225mb131","value":{"widthMm":920,"heightMm":691,"depthMm":949}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_10245edb88c5327a5ebc', 'KIMCHI_REFRIGERATOR', 'LG', 'Z135MEE123', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 666, 612, 900, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z135mee123","value":{"widthMm":666,"heightMm":612,"depthMm":900}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_41ff27c0929ea7c3fc71', 'KIMCHI_REFRIGERATOR', 'LG', 'Z225MEE151', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 920, 691, 949, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z225mee151","value":{"widthMm":920,"heightMm":691,"depthMm":949}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_48a7c3fe98736280ab77', 'KIMCHI_REFRIGERATOR', 'LG', 'Z330MEEF11', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 666, 737, 1787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z330meef11","value":{"widthMm":666,"heightMm":737,"depthMm":1787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1a969b40ff8b009178d0', 'KIMCHI_REFRIGERATOR', 'LG', 'Z330MRRF21', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 666, 737, 1787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z330mrrf21","value":{"widthMm":666,"heightMm":737,"depthMm":1787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_28d636b8523bd8dfbf25', 'KIMCHI_REFRIGERATOR', 'LG', 'Z334GBB122', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 666, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z334gbb122","value":{"widthMm":666,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ff907ebcb551e02e4131', 'KIMCHI_REFRIGERATOR', 'LG', 'Z334GBB151', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 666, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z334gbb151","value":{"widthMm":666,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_82375ca6a47e3ffaa5fd', 'KIMCHI_REFRIGERATOR', 'LG', 'Z334GBB171', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 666, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z334gbb171","value":{"widthMm":666,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_41c49abe9472f996b9a4', 'KIMCHI_REFRIGERATOR', 'LG', 'Z334GBB172', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 666, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z334gbb172","value":{"widthMm":666,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b29356e3753925489510', 'KIMCHI_REFRIGERATOR', 'LG', 'Z334MQQ122S', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 666, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z334mqq122s","value":{"widthMm":666,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f3ec1856b956d4a1b5e7', 'KIMCHI_REFRIGERATOR', 'LG', 'Z334SVV171S', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 666, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z334svv171s","value":{"widthMm":666,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cdb25196fbba05138f81', 'KIMCHI_REFRIGERATOR', 'LG', 'Z403MEEF53', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 750, 795, 1787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z403meef53","value":{"widthMm":750,"heightMm":795,"depthMm":1787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_eb402ded0db3f64f3159', 'KIMCHI_REFRIGERATOR', 'LG', 'Z484GBB123', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 835, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z484gbb123","value":{"widthMm":835,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a1f88581a83d8eb5b309', 'KIMCHI_REFRIGERATOR', 'LG', 'Z484GBB152', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 835, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z484gbb152","value":{"widthMm":835,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cdf66c50669acf062e4e', 'KIMCHI_REFRIGERATOR', 'LG', 'Z484GBB172', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 835, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z484gbb172","value":{"widthMm":835,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_feba170451447e260d25', 'KIMCHI_REFRIGERATOR', 'LG', 'Z484GBB173', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 Fit & Max', 835, 685, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z484gbb173","value":{"widthMm":835,"heightMm":685,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_290cb4e9b6f35946dc09', 'KIMCHI_REFRIGERATOR', 'LG', 'Z490MEEF11', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 김치톡톡', 835, 838, 1795, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z490meef11","value":{"widthMm":835,"heightMm":838,"depthMm":1795}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0fbfb51088d0e40baf6a', 'KIMCHI_REFRIGERATOR', 'LG', 'Z490MEEF12', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 김치톡톡', 835, 838, 1795, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z490meef12","value":{"widthMm":835,"heightMm":838,"depthMm":1795}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c9564a99c9b210125d3e', 'KIMCHI_REFRIGERATOR', 'LG', 'Z490MPSF11', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 김치톡톡', 835, 838, 1795, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z490mpsf11","value":{"widthMm":835,"heightMm":838,"depthMm":1795}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_74e37645a42779e29c0f', 'KIMCHI_REFRIGERATOR', 'LG', 'Z495GBB261', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 김치톡톡', 835, 838, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z495gbb261","value":{"widthMm":835,"heightMm":838,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_25aaeac51491899e34e7', 'KIMCHI_REFRIGERATOR', 'LG', 'Z495GBB271', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 김치톡톡', 835, 838, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z495gbb271","value":{"widthMm":835,"heightMm":838,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_44e5e6da0277d4e7ddf5', 'KIMCHI_REFRIGERATOR', 'LG', 'Z495SVV271', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 김치톡톡', 835, 838, 1860, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z495svv271","value":{"widthMm":835,"heightMm":838,"depthMm":1860}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b6a9111c684c29ba2405', 'KIMCHI_REFRIGERATOR', 'LG', 'Z509MEEF33', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 835, 730, 1787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z509meef33","value":{"widthMm":835,"heightMm":730,"depthMm":1787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ce9c82387a0d3d2b3975', 'KIMCHI_REFRIGERATOR', 'LG', 'Z509MPSF13', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡', 835, 730, 1787, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/kimchi-refrigerators/z509mpsf13","value":{"widthMm":835,"heightMm":730,"depthMm":1787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9bdadc491062f37ec7b0', 'DISHWASHER', '삼성', 'DW80F71Y1UEWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 12인용', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw80f71y1uews-d2c/DW80F71Y1UEWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e8b79be8ed84a246def4', 'DISHWASHER', '삼성', 'DW80F73X1UEWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw80f73x1uews-d2c/DW80F73X1UEWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_97f9ec69e43c73946c12', 'DISHWASHER', '삼성', 'DW80F73Y1UEWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw80f73y1uews-d2c/DW80F73Y1UEWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d846d5d4143f0cafffba', 'DISHWASHER', '삼성', 'DW80F75K1USWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용 (필터 내장형)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw80f75k1usws-d2c/DW80F75K1USWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e53b17671841fc01ae98', 'DISHWASHER', '삼성', 'DW90F79F1U01S', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용 (필터 내장형, 컵 맞춤 세척)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw90f79f1u01s-d2c/DW90F79F1U01S/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9054418298b18ac5acc3', 'DISHWASHER', '삼성', 'DW90F79F1USWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용 (필터 내장형, 컵 맞춤 세척)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw90f79f1usws-d2c/DW90F79F1USWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0d763b5d7977e7d35120', 'DISHWASHER', '삼성', 'DW90F79P1U01S', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용 (컵 맞춤 세척)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw90f79p1u01s-d2c/DW90F79P1U01S/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_92d9dffffdba9e2bc51b', 'DISHWASHER', '삼성', 'DW90F79P1USWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용 (컵 맞춤 세척)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw90f79p1usws-d2c/DW90F79P1USWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_aad6d247b40218504042', 'DISHWASHER', '삼성', 'DW99F79E1UHCS', ARRAY[]::TEXT[], 'Infinite AI 식기세척기 빌트인 14인용 (필터 내장형, 컵 맞춤 세척)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/built-in-dw99f79e1uhcs-d2c/DW99F79E1UHCS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_51ebd15ee3ba41015788', 'DISHWASHER', '삼성', 'DW30FB300CW0', ARRAY[]::TEXT[], 'Bespoke 식기세척기 카운터탑 6인용', 555, 450, 500, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/countertop-dw30fb300cw0-d2c/DW30FB300CW0/","value":{"widthMm":555,"heightMm":450,"depthMm":500}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2b0e88adb2852f936bb5', 'DISHWASHER', '삼성', 'DW30FB305CE0', ARRAY[]::TEXT[], 'Bespoke 식기세척기 카운터탑 6인용 (열풍건조)', 555, 450, 500, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/countertop-dw30fb305ce0-d2c/DW30FB305CE0/","value":{"widthMm":555,"heightMm":450,"depthMm":500}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7bbed35737662df826f2', 'DISHWASHER', '삼성', 'DW80F73Y1FEW', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 프리스탠딩 14인용', 598, 845, 600, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/free-standing-dw80f73y1few-d2c/DW80F73Y1FEW/","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5ef1e8ce3e540ea84387', 'DISHWASHER', '삼성', 'DW80F73Y1FEWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 프리스탠딩 14인용', 598, 845, 600, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/free-standing-dw80f73y1fews-d2c/DW80F73Y1FEWS/","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5eaa41f93f15d573b898', 'DISHWASHER', '삼성', 'DW80F75K1UW6FF', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 빌트인 14인용 (필터 내장형)+정수필터 내장형 교체용 1개', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/package-dw80f75k1uw6ff-d2c/DW80F75K1UW6FF/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d8305c71f5342ee98829', 'DISHWASHER', '삼성', 'DW80F71Y1SEWS', ARRAY[]::TEXT[], 'Bespoke AI 식기세척기 세미 빌트인 12인용', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/semi-built-in-dw80f71y1sews-d2c/DW80F71Y1SEWS/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1766c98384c1c4ef7fd7', 'DISHWASHER', '삼성', 'DW99F79E1B00S', ARRAY[]::TEXT[], 'Infinite AI 식기세척기 트루빌트인 14인용 (필터 내장형, 컵 맞춤 세척)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/dishwashers/true-built-in-dw99f79e1b00s-d2c/DW99F79E1B00S/","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4b675debf72da8211888', 'DISHWASHER', 'LG', '1BGE-QKBOE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/1bge-qkboe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_84a22b2ac21f4e6e42fb', 'DISHWASHER', 'LG', '4BGE-QKBOE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/4bge-qkboe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e6ca8d4148fd886b0192', 'DISHWASHER', 'LG', '6BG2E-AMBOE', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 식기세척기 + LG 디오스 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/6bg2e-amboe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2502b76eaf93dd0475b3', 'DISHWASHER', 'LG', '6BG2E-QKBOE', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/6bg2e-qkboe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e0a3b3b7a7d4f7efdb55', 'DISHWASHER', 'LG', '6EW2E-ANHOE', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/6ew2e-anhoe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4e40af3e016eca1ccb7d', 'DISHWASHER', 'LG', '6EW2E-QKBOE', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/6ew2e-qkboe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b91f28174a4677c77ab8', 'DISHWASHER', 'LG', '6EW2E-QKHOE', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/6ew2e-qkhoe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_50f655f69a897ae19958', 'DISHWASHER', 'LG', '6EW3E-QKBOE', ARRAY[]::TEXT[], 'LG 디오스 AI 오브제컬렉션 식기세척기 + LG 디오스 오브제컬렉션 인덕션', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/6ew3e-qkboe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8178712224c16c1e97d1', 'DISHWASHER', 'LG', 'DEE6BGE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/dee6bge","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d0d47f67b25f8bad7af4', 'DISHWASHER', 'LG', 'DEE6EWE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/dee6ewe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5d342e3ec6e8de5c2b0a', 'DISHWASHER', 'LG', 'DFE5BGE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 845, 600, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/dfe5bge","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8b7ceec2b92586b4b7b4', 'DISHWASHER', 'LG', 'DFE6BGE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 300, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/dfe6bge","value":{"widthMm":598,"heightMm":300,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_41b7a97e091770d13520', 'DISHWASHER', 'LG', 'DFE6BGHE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 845, 600, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/dfe6bghe","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_384378225d550fc3cd8c', 'DISHWASHER', 'LG', 'DUB61TBE', ARRAY[]::TEXT[], 'LG 디오스 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/dub61tbe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6ca5ca72d0dad8254179', 'DISHWASHER', 'LG', 'DUE1BGL1E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due1bgl1e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_da2854bfa343490eca78', 'DISHWASHER', 'LG', 'DUE4BGE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due4bge","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_610ac63c368a17269786', 'DISHWASHER', 'LG', 'DUE4BGL1E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due4bgl1e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ce2d4019e5d1abec5aeb', 'DISHWASHER', 'LG', 'DUE5BGE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due5bge","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_60d62730ae7b0f18f2ca', 'DISHWASHER', 'LG', 'DUE5BGHE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due5bghe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b5133495c462aa709770', 'DISHWASHER', 'LG', 'DUE5BGL1E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due5bgl1e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_07f2fa4c45eb467b5f5c', 'DISHWASHER', 'LG', 'DUE5BGL2E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due5bgl2e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b024a7c9c355a135e653', 'DISHWASHER', 'LG', 'DUE5MBL2E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due5mbl2e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_8436c39abee0fbe8623c', 'DISHWASHER', 'LG', 'DUE6BGL1E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6bgl1e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e2431be03ac5a60cd08a', 'DISHWASHER', 'LG', 'DUE6BGL2E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6bgl2e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_213576c6c6cb40f24256', 'DISHWASHER', 'LG', 'DUE6BGL3E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6bgl3e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_51444a8f7cdb889a1f7b', 'DISHWASHER', 'LG', 'DUE6BGLE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6bgle","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fc207b19cb35dd2701f0', 'DISHWASHER', 'LG', 'DUE6EWL2E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6ewl2e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6882d35b84ff17d26489', 'DISHWASHER', 'LG', 'DUE6GLHE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6glhe","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_04cf9b288aed584be266', 'DISHWASHER', 'LG', 'DUE6PFL3E', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, NULL, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/dishwashers/due6pfl3e","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;
