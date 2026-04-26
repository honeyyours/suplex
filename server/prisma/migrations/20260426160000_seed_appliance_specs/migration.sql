-- 가전 규격 DB 시드 데이터 (자동 생성)
-- 출처: appliance-seed-*.json (4개 카테고리)
-- 정책: ON CONFLICT (modelCode) DO NOTHING — 재실행 시 기존 데이터 보존
-- 검증 상태: VERIFIED (≥2 출처 일치) / PENDING (단일 출처) / DISPUTED (출처 불일치)

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6b52f58a40727584c494', 'REFRIGERATOR', 'LG', 'S834MEE30E', ARRAY['디오스 오브제컬렉션 매직스페이스 832L']::TEXT[], 'LG 디오스 오브제컬렉션 매직스페이스 양문형 832L', 913, 1790, 913, NULL, NULL, NULL, NULL, '양문형', 832, FALSE, 2024, TRUE, '[{"tier":1,"url":"https://www.lge.co.kr/refrigerators/s834mee30e","value":{"widthMm":913,"heightMm":1790,"depthMm":913}},{"tier":3,"url":"https://prod.danawa.com/info/?pcode=49087124","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_be50fa6e8309feebaeca', 'REFRIGERATOR', 'LG', 'S834W30V', ARRAY['디오스 매직스페이스 832L 화이트']::TEXT[], 'LG 디오스 매직스페이스 양문형 832L 화이트', 913, 1790, 913, NULL, NULL, NULL, NULL, '양문형', 832, FALSE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=16497383","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_48f224beff6e159bc636', 'REFRIGERATOR', 'LG', 'T875MEE111', ARRAY['디오스 오브제컬렉션 매직스페이스 870L 4도어']::TEXT[], 'LG 디오스 오브제컬렉션 매직스페이스 4도어 870L', 914, 1787, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=65353772","value":{"widthMm":914,"heightMm":1787,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_153f8f46cf62780ac44b', 'REFRIGERATOR', 'LG', 'T873MEE312', ARRAY['디오스 오브제컬렉션 노크온 870L']::TEXT[], 'LG 디오스 오브제컬렉션 노크온 4도어 870L', 914, 1787, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2022, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=17432711","value":{"widthMm":914,"heightMm":1787,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f2c5eec95ad302597b6e', 'REFRIGERATOR', 'LG', 'T873MWW312', ARRAY['디오스 오브제컬렉션 노크온 870L 화이트']::TEXT[], 'LG 디오스 오브제컬렉션 노크온 4도어 870L 네이처화이트', 914, 1787, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=17432243","value":{"widthMm":914,"heightMm":1787,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f8ba090996d76beb30a8', 'REFRIGERATOR', 'LG', 'F873SN35E', ARRAY['디오스 매직스페이스 4도어 870L']::TEXT[], 'LG 디오스 매직스페이스 4도어 870L', 912, 1787, 928, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11262792","value":{"widthMm":912,"heightMm":1787,"depthMm":928}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3358e95155bed403009b', 'REFRIGERATOR', 'LG', 'F873SS31H', ARRAY['디오스 매직스페이스 4도어 870L 샤이니퓨어']::TEXT[], 'LG 디오스 매직스페이스 4도어 870L 샤이니퓨어', 912, 1790, 928, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11968397","value":{"widthMm":912,"heightMm":1790,"depthMm":928}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_51e20809bc6d36af28b3', 'REFRIGERATOR', 'LG', 'F874SS31H', ARRAY['디오스 매직스페이스 4도어 870L 2등급']::TEXT[], 'LG 디오스 매직스페이스 4도어 870L', 912, 1787, 928, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=15454127","value":{"widthMm":912,"heightMm":1787,"depthMm":928}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_bdafad445a5acec0a4b4', 'REFRIGERATOR', 'LG', 'F874S30', ARRAY['디오스 매직스페이스 4도어 866L 퓨어']::TEXT[], 'LG 디오스 매직스페이스 4도어 866L 퓨어', 912, 1787, 928, NULL, NULL, NULL, NULL, '4도어', 866, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=15457934","value":{"widthMm":912,"heightMm":1787,"depthMm":928}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cee9a0e4749d03896a52', 'REFRIGERATOR', '삼성', 'RF85C9101AP', ARRAY['BESPOKE AI 4도어 870L']::TEXT[], '삼성 BESPOKE AI 4도어 870L', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/french-door-rf85c9101ap-d2c/RF85C9101AP/","value":{"widthMm":912,"heightMm":1853,"depthMm":930}},{"tier":3,"url":"https://prod.danawa.com/info/?pcode=19423913","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_46590916bd69ed74ea5f', 'REFRIGERATOR', '삼성', 'RF85R9281AP', ARRAY['비스포크 코타 4도어 867L']::TEXT[], '삼성 BESPOKE 코타 4도어 867L', 908, 1853, 922, NULL, NULL, NULL, NULL, '4도어', 867, FALSE, 2019, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=8935550","value":{"widthMm":908,"heightMm":1853,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9564d53a9945c533f95f', 'REFRIGERATOR', '삼성', 'RF85T9141AP', ARRAY['비스포크 글램 4도어 870L']::TEXT[], '삼성 BESPOKE 글램 4도어 870L', 908, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11196783","value":{"widthMm":908,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_af1d464755fe79d07da1', 'REFRIGERATOR', '삼성', 'RS84DB5242CW', ARRAY['비스포크 양문형 851L 화이트']::TEXT[], '삼성 BESPOKE 양문형 851L 코타PCM화이트', 912, 1786, 915, NULL, NULL, NULL, NULL, '양문형', 851, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=64467116","value":{"widthMm":912,"heightMm":1786,"depthMm":915}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_941eb249cffd540ae960', 'REFRIGERATOR', '삼성', 'RS84DB5661CW', ARRAY['비스포크 양문형 845L']::TEXT[], '삼성 BESPOKE 양문형 845L 코타PCM화이트', 912, 1786, 915, NULL, NULL, NULL, NULL, '양문형', 845, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=64467500","value":{"widthMm":912,"heightMm":1786,"depthMm":915}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fbe9a69f594657e1fe81', 'REFRIGERATOR', '삼성', 'RF60A91C3AP', ARRAY['비스포크 키친핏 코타 615L']::TEXT[], '삼성 BESPOKE 키친핏 4도어 615L', 915, 1853, 697, NULL, NULL, NULL, NULL, '4도어 키친핏', 615, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=13639475","value":{"widthMm":915,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f00a9aaad68736621c5c', 'REFRIGERATOR', '삼성', 'RF85DB90F1AP', ARRAY['비스포크 에센셜 4도어 874L']::TEXT[], '삼성 BESPOKE 에센셜 4도어 874L', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 874, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=44405345","value":{"widthMm":912,"heightMm":1853,"depthMm":930}},{"tier":3,"url":"https://prod.danawa.com/info/?pcode=44405372","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_21e1f516c3c0c292c68e', 'REFRIGERATOR', 'LG', 'S831TS35', ARRAY['디오스 매직스페이스 양문형 821L 샤인']::TEXT[], 'LG 디오스 매직스페이스 양문형 821L 샤인', 912, 1785, 915, NULL, NULL, NULL, NULL, '양문형', 821, FALSE, 2018, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=6037742","value":{"widthMm":912,"heightMm":1785,"depthMm":915}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_148e8f3b445fbfebcd48', 'REFRIGERATOR', 'LG', 'S833S30', ARRAY['디오스 매직스페이스 양문형 821L 퓨어화이트']::TEXT[], 'LG 디오스 매직스페이스 양문형 821L 퓨어화이트', 912, 1790, 927, NULL, NULL, NULL, NULL, '양문형', 821, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11725922","value":{"widthMm":912,"heightMm":1790,"depthMm":927}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ffd4e8f76d4bda0a0889', 'REFRIGERATOR', 'LG', 'S833SS32', ARRAY['디오스 매직스페이스 양문형 821L 샤이니퓨어']::TEXT[], 'LG 디오스 매직스페이스 양문형 821L 샤이니퓨어', 912, 1790, 927, NULL, NULL, NULL, NULL, '양문형', 821, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11699516","value":{"widthMm":912,"heightMm":1790,"depthMm":927}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c2884112bce653ee09e9', 'REFRIGERATOR', 'LG', 'S834BB30', ARRAY['디오스 오브제컬렉션 매직스페이스 양문형 832L 베이지']::TEXT[], 'LG 디오스 오브제컬렉션 매직스페이스 양문형 832L 베이지', 913, 1790, 913, NULL, NULL, NULL, NULL, '양문형', 832, FALSE, 2021, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=15730082","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1744b284b2f69d5eb27d', 'REFRIGERATOR', 'LG', 'T873MEE111', ARRAY['디오스 오브제컬렉션 매직스페이스 870L 베이지']::TEXT[], 'LG 디오스 오브제컬렉션 매직스페이스 4도어 870L 베이지', 914, 1787, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2022, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=17432711","value":{"widthMm":914,"heightMm":1787,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_adb01d4597c28e5df6a1', 'REFRIGERATOR', 'LG', 'M870GBB451', ARRAY['디오스 오브제컬렉션 노크온 매직스페이스 870L']::TEXT[], 'LG 디오스 오브제컬렉션 노크온 매직스페이스 4도어 870L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=12542291","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c50ef66a8e9fd02a4f97', 'REFRIGERATOR', 'LG', 'M874GBB031', ARRAY['디오스 오브제컬렉션 베이직 875L 베이지']::TEXT[], 'LG 디오스 오브제컬렉션 베이직 4도어 875L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=20264123","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c9fa5dbc88f1da0e74ce', 'REFRIGERATOR', 'LG', 'M874GCB452', ARRAY['디오스 오브제컬렉션 노크온 매직스페이스 875L']::TEXT[], 'LG 디오스 오브제컬렉션 노크온 매직스페이스 4도어 875L 클레이브라운/베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=20388215","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f5061dfc0f28e967b48c', 'REFRIGERATOR', 'LG', 'M874GBB171', ARRAY['디오스 오브제컬렉션 미스트 매직스페이스 860L']::TEXT[], 'LG 디오스 오브제컬렉션 미스트 매직스페이스 4도어 860L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 860, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=27728822","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_893ecaa215c49185334e', 'REFRIGERATOR', 'LG', 'H875GBB111', ARRAY['디오스 오브제컬렉션 미스트 매직스페이스 870L']::TEXT[], 'LG 디오스 오브제컬렉션 미스트 매직스페이스 4도어 870L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=65353271","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_625fd2466f15208ef60a', 'REFRIGERATOR', 'LG', 'M623GBB052', ARRAY['디오스 오브제컬렉션 빌트인 610L']::TEXT[], 'LG 디오스 오브제컬렉션 빌트인 타입 4도어 610L 베이지', 914, 1860, 698, NULL, NULL, NULL, NULL, '4도어 빌트인', 610, TRUE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=17079827","value":{"widthMm":914,"heightMm":1860,"depthMm":698}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ab8637c101dca9e5f8a0', 'REFRIGERATOR', 'LG', 'M623GBB042S', ARRAY['디오스 오브제컬렉션 빌트인 미스트 610L']::TEXT[], 'LG 디오스 오브제컬렉션 빌트인 미스트 4도어 610L 베이지', 914, 1860, 698, NULL, NULL, NULL, NULL, '4도어 빌트인', 610, TRUE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=18817541","value":{"widthMm":914,"heightMm":1860,"depthMm":698}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_24c87e23256ee827067c', 'REFRIGERATOR', 'LG', 'R-S804NHPR', ARRAY['디오스 양문형 798L 화이트']::TEXT[], 'LG 디오스 일반 양문형 798L 화이트', 912, 1785, 965, NULL, NULL, NULL, NULL, '양문형', 798, FALSE, 2014, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=2639355","value":{"widthMm":912,"heightMm":1785,"depthMm":965}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_914b140e2397f0f71922', 'REFRIGERATOR', '삼성', 'RS84T5081SA', ARRAY['삼성 양문형 846L 메탈그라파이트']::TEXT[], '삼성 양문형 846L 메탈 그라파이트', 912, 1780, 915, NULL, NULL, NULL, NULL, '양문형', 846, FALSE, 2020, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11312268","value":{"widthMm":912,"heightMm":1780,"depthMm":915}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_103dc609eda2d6912bd1', 'REFRIGERATOR', '삼성', 'RF85T9111', ARRAY['비스포크 코타 4도어 871L 화이트']::TEXT[], '삼성 BESPOKE 코타 4도어 871L 화이트', 908, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 871, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11403381","value":{"widthMm":908,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_313ed58298a65ec54711', 'REFRIGERATOR', '삼성', 'RF85A9101', ARRAY['비스포크 코타 4도어 875L 화이트']::TEXT[], '삼성 BESPOKE 코타 4도어 875L 화이트', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=13666409","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fc02d2e94866e766a045', 'REFRIGERATOR', '삼성', 'RF85A9241', ARRAY['비스포크 코타 4도어 866L 화이트']::TEXT[], '삼성 BESPOKE 코타 4도어 866L 화이트', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 866, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=13741670","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_62c3301c7e72d55b3e0f', 'REFRIGERATOR', '삼성', 'RF85B9111AP', ARRAY['비스포크 글램 4도어 875L']::TEXT[], '삼성 BESPOKE 글램 4도어 875L', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=16579286","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f08dd8b6a9b71a35e0ea', 'REFRIGERATOR', '삼성', 'RF85B96X1AP', ARRAY['비스포크 글램 4도어 836L 정수기형']::TEXT[], '삼성 BESPOKE 글램 4도어 836L 정수기형', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 836, FALSE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=16581011","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_30e6f0522c8fb155d439', 'REFRIGERATOR', '삼성', 'RF85DB91F1', ARRAY['비스포크 에센셜 4도어 869L']::TEXT[], '삼성 BESPOKE 에센셜 4도어 869L 화이트', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 869, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=44998895","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_56410baf3009729b37eb', 'REFRIGERATOR', '삼성', 'RF60DB9KF2AP', ARRAY['비스포크 키친핏 바이브 4도어 615L']::TEXT[], '삼성 BESPOKE 키친핏 4도어 615L (UV탈취)', 912, 1853, 697, NULL, NULL, NULL, NULL, '4도어 키친핏', 615, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=41493962","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_bfec63d5a45491ae2061', 'REFRIGERATOR', '삼성', 'RM70F63R2A', ARRAY['비스포크 키친핏 Max 640L']::TEXT[], '삼성 BESPOKE AI 키친핏 Max 4도어 640L', 912, 1853, 697, NULL, NULL, NULL, NULL, '4도어 키친핏', 640, FALSE, 2025, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=77705156","value":{"widthMm":912,"heightMm":1853,"depthMm":697}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7ff8e0d6af4868984652', 'REFRIGERATOR', '삼성', 'RF10B9935BTG', ARRAY['비스포크 인피니트 라인 세라 930L']::TEXT[], '삼성 BESPOKE 인피니트라인 세라 4도어 930L 블랙', 912, 1856, 930, NULL, NULL, NULL, NULL, '4도어', 930, FALSE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=16852136","value":{"widthMm":912,"heightMm":1856,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d6efa6d711274a3a1ef1', 'REFRIGERATOR', '삼성', 'RS84DB5002CW', ARRAY['비스포크 양문형 852L 코타화이트']::TEXT[], '삼성 BESPOKE 양문형 852L 코타PCM화이트', 912, 1780, 915, NULL, NULL, NULL, NULL, '양문형', 852, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://www.samsung.com/sec/refrigerators/side-by-side-rs84db5002cw-d2c/RS84DB5002CW/","value":{"widthMm":912,"heightMm":1780,"depthMm":915}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d2709053328a3cce0011', 'REFRIGERATOR', 'LG', 'S834MGW1D', ARRAY['디오스 오브제컬렉션 베이직 832L 그레이/화이트']::TEXT[], 'LG 디오스 오브제컬렉션 베이직 양문형 832L 그레이/화이트', 913, 1790, 913, NULL, NULL, NULL, NULL, '양문형', 832, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=18934229","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_92f00ac1a2ab654266f8', 'REFRIGERATOR', 'LG', 'S834S1D', ARRAY['디오스 베이직 양문형 832L 퓨어']::TEXT[], 'LG 디오스 베이직 양문형 832L 네이처 퓨어', 913, 1790, 913, NULL, NULL, NULL, NULL, '양문형', 832, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=19905149","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7c9fe48974b7d9bb9d2a', 'REFRIGERATOR', 'LG', 'F873SN35', ARRAY['디오스 매직스페이스 4도어 870L 메탈']::TEXT[], 'LG 디오스 매직스페이스 4도어 870L', 912, 1787, 928, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11726366","value":{"widthMm":912,"heightMm":1787,"depthMm":928}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_817059a63b3ba3f097e9', 'REFRIGERATOR', 'LG', 'H874GBB111', ARRAY['디오스 오브제컬렉션 미스트 매직스페이스 870L']::TEXT[], 'LG 디오스 오브제컬렉션 미스트 매직스페이스 4도어 870L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=21570167","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e8a3c9f077e078b59b17', 'REFRIGERATOR', 'LG', 'M874GBB151', ARRAY['디오스 오브제컬렉션 미스트 매직스페이스 875L']::TEXT[], 'LG 디오스 오브제컬렉션 미스트 매직스페이스 4도어 875L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2023, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=20329319","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e43d33aa0f3b0358a4c0', 'REFRIGERATOR', 'LG', 'M872GBB551', ARRAY['디오스 오브제컬렉션 노크온 더블매직스페이스 870L']::TEXT[], 'LG 디오스 오브제컬렉션 노크온 더블매직스페이스 4도어 870L 베이지', 914, 1860, 918, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2021, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=15454913","value":{"widthMm":914,"heightMm":1860,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3c092da1828aa8e66212', 'REFRIGERATOR', 'LG', 'F871S30', ARRAY['디오스 매직스페이스 4도어 866L']::TEXT[], 'LG 디오스 매직스페이스 4도어 866L 메탈', 912, 1802, 918, NULL, NULL, NULL, NULL, '4도어', 866, FALSE, 2018, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=6121680","value":{"widthMm":912,"heightMm":1802,"depthMm":918}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a933e106ff760f8b373f', 'REFRIGERATOR', 'LG', 'S839S30', ARRAY['디오스 양문형 830L 퓨어']::TEXT[], 'LG 디오스 양문형 830L 퓨어', 912, 1785, 927, NULL, NULL, NULL, NULL, '양문형', 830, FALSE, 2017, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=4912915","value":{"widthMm":912,"heightMm":1785,"depthMm":927}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_20bba400e481570f94c4', 'REFRIGERATOR', '삼성', 'RF90DG91114E', ARRAY['비스포크 4도어 902L']::TEXT[], '삼성 BESPOKE AI 4도어 902L 매트크리미베이지', 912, 1830, 922, NULL, NULL, NULL, NULL, '4도어', 902, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=42081419","value":{"widthMm":912,"heightMm":1830,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_043f83399ae7b98bdd32', 'REFRIGERATOR', '삼성', 'RF85B96W1AP', ARRAY['비스포크 글램 4도어 835L']::TEXT[], '삼성 BESPOKE 글램 4도어 835L 정수기형', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 835, FALSE, 2022, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=16419953","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_23f5bfb7fcef296d7da5', 'REFRIGERATOR', '삼성', 'RF85DB90B1AP', ARRAY['비스포크 바이브 4도어 875L']::TEXT[], '삼성 BESPOKE 바이브 4도어 875L', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2024, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=42131483","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_213a5fb67e6a4a2a5bf8', 'REFRIGERATOR', '삼성', 'RF85T92P1AP', ARRAY['비스포크 코타 4도어 850L']::TEXT[], '삼성 BESPOKE 코타 4도어 850L', 908, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 850, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=11348373","value":{"widthMm":908,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_51b2b36b329e2f87f279', 'REFRIGERATOR', '삼성', 'RF85R9203', ARRAY['비스포크 새틴 4도어 868L 그레이']::TEXT[], '삼성 BESPOKE 새틴 4도어 868L 새틴그레이', 908, 1853, 922, NULL, NULL, NULL, NULL, '4도어', 868, FALSE, 2019, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=8113696","value":{"widthMm":908,"heightMm":1853,"depthMm":922}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_51abfbdcf5e8cdcd7824', 'REFRIGERATOR', 'LG', 'F873SS31', ARRAY['디오스 매직스페이스 4도어 870L']::TEXT[], 'LG 디오스 매직스페이스 4도어 870L', 912, 1787, 928, NULL, NULL, NULL, NULL, '4도어', 870, FALSE, 2020, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=12496583","value":{"widthMm":912,"heightMm":1787,"depthMm":928}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1bc5b71ae15e1801ce8c', 'REFRIGERATOR', 'LG', 'S834S20', ARRAY['디오스 양문형 826L 퓨어']::TEXT[], 'LG 디오스 양문형 826L 퓨어', 912, 1790, 927, NULL, NULL, NULL, NULL, '양문형', 826, FALSE, 2021, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=15738488","value":{"widthMm":912,"heightMm":1790,"depthMm":927}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cdd3cf3680b4521fedbb', 'REFRIGERATOR', 'LG', 'S836MQQ012', ARRAY['디오스 AI 오브제컬렉션 832L 에센스화이트']::TEXT[], 'LG 디오스 AI 오브제컬렉션 양문형 832L 에센스화이트', 913, 1790, 913, NULL, NULL, NULL, NULL, '양문형', 832, FALSE, 2025, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=94523804","value":{"widthMm":913,"heightMm":1790,"depthMm":913}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4bf0f8e526ddcb3e2728', 'REFRIGERATOR', 'LG', 'S631S32', ARRAY['디오스 세미빌트인 양문형 636L 퓨어']::TEXT[], 'LG 디오스 세미빌트인 양문형 636L 퓨어', 912, 1790, 738, NULL, NULL, NULL, NULL, '양문형 세미빌트인', 636, FALSE, 2018, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=6031018","value":{"widthMm":912,"heightMm":1790,"depthMm":738}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_29abc400d23d8c0a1d62', 'REFRIGERATOR', 'LG', 'S634S32Q', ARRAY['디오스 세미빌트인 양문형 652L 퓨어']::TEXT[], 'LG 디오스 세미빌트인 양문형 652L 퓨어', 913, 1790, 735, NULL, NULL, NULL, NULL, '양문형 세미빌트인', 652, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=15684917","value":{"widthMm":913,"heightMm":1790,"depthMm":735}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e61a6a93af3f29cb50c6', 'REFRIGERATOR', '삼성', 'RB33A3662AP', ARRAY['비스포크 키친핏 코타 333L']::TEXT[], '삼성 BESPOKE 키친핏 2도어 333L 상냉장하냉동', 595, 1853, 669, NULL, NULL, NULL, NULL, '상냉장하냉동', 333, FALSE, 2021, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=14096669","value":{"widthMm":595,"heightMm":1853,"depthMm":669}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_23553e2f914586f955f9', 'REFRIGERATOR', '삼성', 'RB33A3004AP', ARRAY['비스포크 키친핏 코타 333L']::TEXT[], '삼성 BESPOKE 키친핏 2도어 333L 상냉장하냉동', 595, 1853, 669, NULL, NULL, NULL, NULL, '상냉장하냉동', 333, FALSE, 2021, FALSE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=14095661","value":{"widthMm":595,"heightMm":1853,"depthMm":669}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_763f517754233f4fdb70', 'REFRIGERATOR', '삼성', 'RF85A9111', ARRAY['비스포크 VCM 4도어 875L 브라우니실버']::TEXT[], '삼성 BESPOKE 4도어 875L 브라우니실버', 912, 1853, 930, NULL, NULL, NULL, NULL, '4도어', 875, FALSE, 2021, TRUE, '[{"tier":3,"url":"https://prod.danawa.com/info/?pcode=13792508","value":{"widthMm":912,"heightMm":1853,"depthMm":930}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_647f6d416af45d487cf1', 'KIMCHI_REFRIGERATOR', 'LG', 'K333SS141', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡 스탠드형 327L (K333SS141, 24년형)', 666, 1802, 737, NULL, NULL, NULL, NULL, '스탠드형', 327, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=28604414","value":{"widthMm":666,"heightMm":1802,"depthMm":737}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7a3c5a1621ff94c55653', 'KIMCHI_REFRIGERATOR', 'LG', 'K335S14E', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡 스탠드형 327L (K335S14E, 21년형)', 666, 1802, 737, NULL, NULL, NULL, NULL, '스탠드형', 327, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=12340046","value":{"widthMm":666,"heightMm":1802,"depthMm":737}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5ccb626e29b9794c3356', 'KIMCHI_REFRIGERATOR', 'LG', 'K337S143', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡 네이처 스탠드형 327L (K337S143, 23년형)', 666, 1802, 737, NULL, NULL, NULL, NULL, '스탠드형', 327, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=20209199","value":{"widthMm":666,"heightMm":1802,"depthMm":737}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a694629d3a3039e5cb1c', 'KIMCHI_REFRIGERATOR', 'LG', 'K417W143', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡 스탠드형 417L (K417W143)', 750, 1787, 795, NULL, NULL, NULL, NULL, '스탠드형', 417, FALSE, 2023, FALSE, '[{"tier":2,"url":"https://www.lge.co.kr/kimchi-refrigerators/k417w143","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6c7b15d0a9cb16de476d', 'KIMCHI_REFRIGERATOR', 'LG', 'Z408MEEF23', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 스탠드형 402L (Z408MEEF23, 24년형)', 750, 1787, 795, NULL, NULL, NULL, NULL, '4도어', 402, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=45872789","value":{"widthMm":750,"heightMm":1787,"depthMm":795}},{"tier":2,"url":"https://www.lge.co.kr/kimchi-refrigerators/z408meef23","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4ea85fba8b4892ea04d6', 'KIMCHI_REFRIGERATOR', 'LG', 'Z499MPSF11', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 4도어 491L (Z499MPSF11)', 835, 1787, 838, NULL, NULL, NULL, NULL, '4도어', 491, FALSE, 2024, FALSE, '[{"tier":2,"url":"https://www.lge.co.kr/kimchi-refrigerators/z499mpsf11","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f44c9287681e60d978af', 'KIMCHI_REFRIGERATOR', 'LG', 'Z494GBB171', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 스탠드형 491L (Z494GBB171, 25년형)', 835, 1860, 838, NULL, NULL, NULL, NULL, '4도어', 491, FALSE, 2025, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=68363213","value":{"widthMm":835,"heightMm":1860,"depthMm":838}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2fc111dab2a1ae105229', 'KIMCHI_REFRIGERATOR', 'LG', 'Z493MEEF32', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 김치톡톡 스탠드형 491L (Z493MEEF32, 24년형)', 835, 1795, 838, NULL, NULL, NULL, NULL, '4도어', 491, FALSE, 2024, FALSE, '[{"tier":2,"url":"https://www.lge.co.kr/kimchi-refrigerators/z493meef32","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_5035036bff45c3120fe6', 'KIMCHI_REFRIGERATOR', 'LG', 'K331W141', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡 스탠드형 327L (K331W141, 22년형)', 666, 1802, 737, NULL, NULL, NULL, NULL, '스탠드형', 327, FALSE, 2022, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=15366479","value":{"widthMm":666,"heightMm":1802,"depthMm":737}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_fa97e2d510fd69a10310', 'KIMCHI_REFRIGERATOR', 'LG', 'K336W142', ARRAY[]::TEXT[], 'LG 디오스 김치톡톡 스탠드형 327L (K336W142)', 666, 1802, 737, NULL, NULL, NULL, NULL, '스탠드형', 327, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=18021704","value":{"widthMm":666,"heightMm":1802,"depthMm":737}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9da8d8fdbcaaab875ef7', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48T94A1S9', ARRAY[]::TEXT[], '삼성 BESPOKE 김치플러스 4도어 486L Refined Inox (RQ48T94A1S9)', 795, 1853, 794, NULL, NULL, NULL, NULL, '4도어', 486, FALSE, 2020, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48t94a1s9/RQ48T94A1S9/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_971c4b4c9301c8a40ff4', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ48T94B2S9', ARRAY[]::TEXT[], '삼성 BESPOKE 김치플러스 4도어 486L (RQ48T94B2S9)', 795, 1853, 794, NULL, NULL, NULL, NULL, '4도어', 486, FALSE, 2020, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq48t94b2t1/RQ48T94B2S9/","value":{"widthMm":795,"heightMm":1853,"depthMm":794}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d6376c394654f2ec02e8', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ58T9481T1', ARRAY[]::TEXT[], '삼성 BESPOKE 김치플러스 4도어 584L Browny Silver (RQ58T9481T1)', 795, 1853, 892, NULL, NULL, NULL, NULL, '4도어', 584, FALSE, 2021, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq58t9481t1/RQ58T9481T1/","value":{"widthMm":795,"heightMm":1853,"depthMm":892}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a989ff2d16c2af3d516e', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49DG90X2EW', ARRAY[]::TEXT[], '삼성 Bespoke AI 김치플러스 4도어 490L AI 정온 (RQ49DG90X2EW)', 795, 1825, 787, NULL, NULL, NULL, NULL, '4도어', 490, FALSE, 2024, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49dg90x2ew-d2c/RQ49DG90X2EW/","value":{"widthMm":795,"heightMm":1825,"depthMm":787}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d56bdd2b4509bd982375', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ49C9002S9', ARRAY[]::TEXT[], '삼성 김치플러스 4도어 490L (RQ49C9002S9)', 795, 1825, 787, NULL, NULL, NULL, NULL, '4도어', 490, FALSE, 2023, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq49c9002s9-d2c/RQ49C9002S9/","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_20eee3228c0606ac2425', 'KIMCHI_REFRIGERATOR', '삼성', 'RQ42A94E1AP', ARRAY[]::TEXT[], '삼성 BESPOKE 김치플러스 4도어 키친핏 420L (RQ42A94E1AP)', 832, 1853, 716, NULL, NULL, NULL, NULL, '4도어', 420, FALSE, 2022, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/kimchi-refrigerators/kimchi-stand-rq42a94e1ap-d2c/RQ42A94E1AP/","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 0, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4aa9230aafc807905b32', 'KIMCHI_REFRIGERATOR', '위니아', 'WDQ48JRLICS', ARRAY[]::TEXT[], '위니아 딤채 스탠드형 4도어 467L (WDQ48JRLICS, 24년형)', 810, 1870, 718, NULL, NULL, NULL, NULL, '4도어', 467, FALSE, 2024, FALSE, '[{"tier":2,"url":"https://www.winia.com/product/view?TYPE=2&PRODUCT_SEQ=3803","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d1c6dde088354abefab1', 'KIMCHI_REFRIGERATOR', '위니아', 'WDQ57JRLIDS', ARRAY[]::TEXT[], '위니아 딤채 스탠드형 4도어 551L (WDQ57JRLIDS, 24년형)', 810, 1870, 798, NULL, NULL, NULL, NULL, '4도어', 551, FALSE, 2024, FALSE, '[{"tier":2,"url":"https://emart.ssg.com/item/itemView.ssg?itemId=1000627220578","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_a3c5013b06c9ec8c03bb', 'KIMCHI_REFRIGERATOR', '위니아', 'LDQ48HBNFES', ARRAY[]::TEXT[], '위니아 딤채 스탠드형 4도어 467L (LDQ48HBNFES, 23년형)', 810, 1870, 738, NULL, NULL, NULL, NULL, '4도어', 467, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=17746733","value":{"widthMm":810,"heightMm":1870,"depthMm":738}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d697869072fd109ec8a8', 'DISHWASHER', 'LG', 'DUB22WA', ARRAY['DUB22WA.AKOR']::TEXT[], 'LG 디오스 식기세척기 스팀 12인용 빌트인 (DUB22WA)', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2021, TRUE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14004344","value":{"widthMm":598,"heightMm":815,"depthMm":567}},{"tier":2,"url":"https://www.lge.co.kr/dishwashers/dub22wa","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_383e6ed90e7ae3341e16', 'DISHWASHER', 'LG', 'DUBJ2EA', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 12인용 빌트인 (DUBJ2EA)', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2020, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=12529766","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6dbe1648e124cc2c6726', 'DISHWASHER', 'LG', 'DUE6BG', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 14인용 빌트인 (DUE6BG)', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=35231621","value":{"widthMm":598,"heightMm":815,"depthMm":567}},{"tier":2,"url":"https://www.lge.co.kr/dishwashers/due6bg","value":{"widthMm":null,"heightMm":null,"depthMm":null}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_0d690966528af40dcdd4', 'DISHWASHER', 'LG', 'DUE6BGE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 14인용 빌트인 (DUE6BGE, 24년형)', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=74006600","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_88438aa9d81e46f56157', 'DISHWASHER', 'LG', 'DUE1BGLE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 12인용 빌트인 (DUE1BGLE, 25년형)', 598, 815, 567, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2025, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=74481458","value":{"widthMm":598,"heightMm":815,"depthMm":567}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6bd04eb3b96f604f5531', 'DISHWASHER', 'LG', 'DFB22WA', ARRAY[]::TEXT[], 'LG 디오스 식기세척기 스팀 12인용 프리스탠딩 (DFB22WA)', 598, 845, 600, NULL, NULL, NULL, NULL, '프리스탠딩', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14004479","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_6867f5ea08fd35cae6d5', 'DISHWASHER', 'LG', 'DTC2NE', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 6인용 카운터탑 (DTC2NE)', 540, 496, 425, NULL, NULL, NULL, NULL, '카운터탑', NULL, FALSE, 2022, FALSE, '[{"tier":2,"url":"https://www.lge.co.kr/dishwashers/dtc2ne","value":{"widthMm":540,"heightMm":496,"depthMm":425}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_eccbed4771c35c455ef5', 'DISHWASHER', 'LG', 'DTC2NH', ARRAY[]::TEXT[], 'LG 디오스 오브제컬렉션 식기세척기 6인용 카운터탑 (DTC2NH)', 540, 496, 425, NULL, NULL, NULL, NULL, '카운터탑', NULL, FALSE, 2023, FALSE, '[{"tier":2,"url":"https://www.lge.co.kr/dishwashers/dtc2nh","value":{"widthMm":540,"heightMm":496,"depthMm":425}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_98e5000f9df8d754d2cd', 'DISHWASHER', 'LG', 'D0633WFA', ARRAY[]::TEXT[], 'LG 디오스 식기세척기 6인용 카운터탑 (D0633WFA)', 540, 496, 425, NULL, NULL, NULL, NULL, '카운터탑', NULL, FALSE, 2018, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=3512978","value":{"widthMm":540,"heightMm":496,"depthMm":425}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e785632ce3ceb38fea7c', 'DISHWASHER', '삼성', 'DW60A8575LBT', ARRAY['DW60A8575TET', 'DW60A8575TES']::TEXT[], '삼성 BESPOKE 식기세척기 12인용 빌트인 열풍건조 (DW60A8575LBT)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14821448","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f01130153acc9b17bca7', 'DISHWASHER', '삼성', 'DW60A8575FG', ARRAY[]::TEXT[], '삼성 BESPOKE 식기세척기 12인용 프리스탠딩 (DW60A8575FG)', 598, 845, 600, NULL, NULL, NULL, NULL, '프리스탠딩', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14534633","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_07f8a12de59508677987', 'DISHWASHER', '삼성', 'DW60A8355FG', ARRAY[]::TEXT[], '삼성 BESPOKE 식기세척기 12인용 프리스탠딩 (DW60A8355FG)', 598, 845, 600, NULL, NULL, NULL, NULL, '프리스탠딩', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14473826","value":{"widthMm":598,"heightMm":845,"depthMm":600}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b9ac705556a2bb2a7ff1', 'DISHWASHER', '삼성', 'DW60BB837WHVS', ARRAY['DW60BB837WSWS', 'DW60BB837WTES']::TEXT[], '삼성 BESPOKE AI 식기세척기 14인용 빌트인 (DW60BB837WHVS, 키친핏)', 595, 815, 572, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=18958211","value":{"widthMm":595,"heightMm":815,"depthMm":572}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_520e2fa9bb6950222885', 'DISHWASHER', '삼성', 'DW60BG837BS', ARRAY['DW60BG837B00']::TEXT[], '삼성 BESPOKE AI 식기세척기 14인용 트루빌트인 (DW60BG837BS)', 600, 815, 575, NULL, NULL, NULL, NULL, '트루빌트인', NULL, TRUE, 2023, FALSE, '[{"tier":2,"url":"https://www.samsung.com/sec/dishwashers/true-built-in-dw60bg837bs-d2c/DW60BG837BS/","value":{"widthMm":600,"heightMm":815,"depthMm":null}},{"tier":2,"url":"https://www.samsung.com/sec/dishwashers/dishwashers-install-guide/","value":{"widthMm":600,"heightMm":815,"depthMm":575}}]'::JSONB, 2, 'PENDING', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_45f9440cf88f24f48fe7', 'DISHWASHER', '삼성', 'DW50A4075U1', ARRAY['DW50A4075U1S']::TEXT[], '삼성 BESPOKE 식기세척기 8인용 빌트인 키친핏 (DW50A4075U1)', 449, 815, 570, NULL, NULL, NULL, NULL, '빌트인', NULL, TRUE, 2022, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=15390332","value":{"widthMm":449,"heightMm":815,"depthMm":570}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_75d2bd7179d0d530a447', 'ROBOT_VACUUM', 'LG', 'R969IA', ARRAY['코드제로 ThinQ R9 보이스', 'R969', '아이언그레이']::TEXT[], 'LG 코드제로 ThinQ R9 보이스', 330, 143, 286, NULL, NULL, NULL, NULL, '본체만', NULL, FALSE, 2020, TRUE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=10582779","value":{"widthMm":330,"heightMm":143,"depthMm":286}},{"tier":1,"url":"https://www.lge.co.kr/vacuum-cleaners/r969ia","value":{"note":"공식 페이지에서 스펙 표 미노출, 모델명·단종 확인"}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_457f16942aec1d49030f', 'ROBOT_VACUUM', 'LG', 'R961IA', ARRAY['코드제로 R9', 'R961', '아이언그레이']::TEXT[], 'LG 코드제로 R9', 330, 143, 286, NULL, NULL, NULL, NULL, '본체만', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14646326","value":{"widthMm":330,"heightMm":143,"depthMm":286,"weightKg":4.2}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b9a2aa7659ee59d5cdbc', 'ROBOT_VACUUM', 'LG', 'RO965WB', ARRAY['코드제로 오브제컬렉션 R9', 'RO965', '올인원타워 T-RB3WU 235x498x432']::TEXT[], 'LG 코드제로 오브제컬렉션 R9 (자동비움)', 330, 143, 286, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://www.lge.co.kr/vacuum-cleaners/ro965wb-beige","value":{"note":"구성품: 본체 R-965WB + 올인원타워 T-RB3WU"}},{"tier":1,"url":"https://prod.danawa.com/info/?pcode=77206658","value":{"widthMm":330,"heightMm":143,"depthMm":286,"dockWidthMm":235,"dockHeightMm":498,"dockDepthMm":432}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7c2b098ce3cbb3fd2961', 'ROBOT_VACUUM', 'LG', 'R9300WB', ARRAY['코드제로 오브제컬렉션 R9 (2025)', 'R9300', '올인원타워 235x498x432']::TEXT[], 'LG 코드제로 오브제컬렉션 R9 (R9300WB)', 330, 143, 286, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2025, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=77206658","value":{"widthMm":330,"heightMm":143,"depthMm":286,"dockWidthMm":235,"dockHeightMm":498,"dockDepthMm":432}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_7892d1e489c1c59d249b', 'ROBOT_VACUUM', 'LG', 'R585WKA1', ARRAY['코드제로 오브제컬렉션 R5', 'R585WKA', '물걸레 흡입 올인원', '스테이션 202x480x233']::TEXT[], 'LG 코드제로 오브제컬렉션 R5 (흡입+물걸레)', 342, 95, 342, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=29311484","value":{"widthMm":342,"heightMm":94.5,"depthMm":342,"weightKg":3.1,"dockWidthMm":202,"dockHeightMm":480,"dockDepthMm":233}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9885bc91893a615d8ea4', 'ROBOT_VACUUM', 'LG', 'R585HKA', ARRAY['코드제로 R5 R585HKA', '흡입 물걸레']::TEXT[], 'LG 코드제로 R5 R585HKA', 342, 95, 342, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=18684239","value":{"widthMm":342,"heightMm":94.5,"depthMm":342}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ec33522d554e9d37b02b', 'ROBOT_VACUUM', '삼성', 'VR50T95935W', ARRAY['BESPOKE 제트봇 AI 미스티화이트', 'VR50T95935', '청정스테이션 305x544x450']::TEXT[], '삼성 BESPOKE 제트 봇 AI (VR50T95935W)', 305, 137, 320, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14017310","value":{"widthMm":305,"heightMm":136.5,"depthMm":320,"weightKg":4.4,"dockWidthMm":305,"dockHeightMm":544,"dockDepthMm":450}},{"tier":1,"url":"https://www.samsung.com/sec/vacuum-cleaners/jetbot-vr50t95935w-d2c/VR50T95935W/","value":{"note":"공식 모델명 확인"}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_337d956e0ed47679a335', 'ROBOT_VACUUM', '삼성', 'VR50T95935P', ARRAY['BESPOKE 제트봇 AI 새틴핑크']::TEXT[], '삼성 BESPOKE 제트 봇 AI (VR50T95935P, 새틴핑크)', 305, 137, 320, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14017508","value":{"widthMm":305,"heightMm":136.5,"depthMm":320,"weightKg":4.4}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ca883a3e0a68f1ce36dc', 'ROBOT_VACUUM', '삼성', 'VR50T95936W', ARRAY['BESPOKE 제트봇 AI 2022', 'VR50T95936']::TEXT[], '삼성 BESPOKE 제트 봇 AI (VR50T95936W, 2022년형)', 305, 137, 320, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2022, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=16421759","value":{"widthMm":305,"heightMm":136.5,"depthMm":320,"weightKg":4.4,"dockWidthMm":305,"dockHeightMm":544,"dockDepthMm":450}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_03ee15bf6dfaabefc3ec', 'ROBOT_VACUUM', '삼성', 'VR30T80313W', ARRAY['BESPOKE 제트봇 미스티화이트', 'VR30T80313']::TEXT[], '삼성 BESPOKE 제트 봇 (VR30T80313W)', 350, 100, 350, NULL, NULL, NULL, NULL, '본체만', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14056946","value":{"widthMm":350,"heightMm":99.8,"depthMm":350,"weightKg":3.4}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_d0808ccfa5465e600c28', 'ROBOT_VACUUM', '삼성', 'VR30T85513W', ARRAY['BESPOKE 제트봇 자동비움', 'VR30T85513', '스테이션 350x544x480']::TEXT[], '삼성 BESPOKE 제트 봇 (VR30T85513W, 자동비움 스테이션)', 350, 100, 350, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=14016683","value":{"widthMm":350,"heightMm":99.8,"depthMm":350,"weightKg":3.4,"dockWidthMm":350,"dockHeightMm":544,"dockDepthMm":480}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f63a92cf7efca2335e3d', 'ROBOT_VACUUM', '삼성', 'VR7MD97716G', ARRAY['BESPOKE AI 스팀', 'VR7MD97716', '스팀살균 물걸레', '스테이션 445x547x510']::TEXT[], '삼성 BESPOKE AI 스팀 (VR7MD97716G)', 359, 100, 364, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=31655570","value":{"widthMm":359,"heightMm":100,"depthMm":364,"weightKg":4.8,"dockWidthMm":445,"dockHeightMm":547,"dockDepthMm":510}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e8a39cfc238963981429', 'ROBOT_VACUUM', '삼성', 'VR7MD96516G', ARRAY['BESPOKE 스팀', 'VR7MD96516']::TEXT[], '삼성 BESPOKE 스팀 (VR7MD96516G)', 359, 100, 364, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=56061341","value":{"note":"VR7MD97716G와 동일 본체 사이즈로 추정 (스팀 공통)"}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ae0a88438a6a574c26cd', 'ROBOT_VACUUM', '로보락', 'S8 Pro Ultra', ARRAY['Roborock S8 Pro Ultra', '도크 426x514x450']::TEXT[], '로보락 S8 Pro Ultra', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=19522775","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"weightKg":4.7,"dockWidthMm":426,"dockHeightMm":514,"dockDepthMm":450}},{"tier":1,"url":"https://us.roborock.com/pages/roborock-s8-pro-ultra","value":{"note":"공식 페이지 모델명 확인"}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3dea70a5960d0cb6895e', 'ROBOT_VACUUM', '로보락', 'S8 MaxV Ultra', ARRAY['Roborock S8 MaxV Ultra', '도크 409x419x470']::TEXT[], '로보락 S8 MaxV Ultra', 350, 103, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=46568612","value":{"widthMm":350,"heightMm":103,"depthMm":353,"weightKg":4.7,"dockWidthMm":409,"dockHeightMm":419,"dockDepthMm":470}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_cfee65daf95cb42a606d', 'ROBOT_VACUUM', '로보락', 'S7 Max Ultra', ARRAY['Roborock S7 Max Ultra', '도크 422x504x420']::TEXT[], '로보락 S7 Max Ultra', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=20504012","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"weightKg":4.75,"dockWidthMm":422,"dockHeightMm":504,"dockDepthMm":420}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_2abcad34393e7f09e582', 'ROBOT_VACUUM', '로보락', 'S5 Max', ARRAY['Roborock S5 Max']::TEXT[], '로보락 S5 Max', 350, 97, 350, NULL, NULL, NULL, NULL, '본체만', NULL, FALSE, 2020, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=11137911","value":{"widthMm":350,"heightMm":96.5,"depthMm":350,"weightKg":3.5}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_9a3f80b9bf1bb02e07c1', 'ROBOT_VACUUM', '로보락', 'S9 MaxV Ultra', ARRAY['Roborock S9 MaxV Ultra', '도크 409x300x440']::TEXT[], '로보락 S9 MaxV Ultra', 350, 80, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2025, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=76508927","value":{"note":"단순 검색 요약 출처, 본체 350x353x79.8, 도크 409x440x300 - 추가 검증 필요"}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_896c2bc519e1411fa9b3', 'ROBOT_VACUUM', '로보락', 'Q Revo', ARRAY['Roborock Qrevo', '도크 340x487x561']::TEXT[], '로보락 Q Revo', 353, 97, 350, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=30622235","value":{"widthMm":353,"heightMm":96.5,"depthMm":350,"dockWidthMm":340,"dockHeightMm":561,"dockDepthMm":487}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_08a3c116c2d049dfe1e4', 'ROBOT_VACUUM', '로보락', 'Q Revo Pro', ARRAY['Roborock Qrevo Pro', '도크 340x487x521']::TEXT[], '로보락 Q Revo Pro', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=49829777","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"dockWidthMm":340,"dockHeightMm":521,"dockDepthMm":487}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_b958b82d558e10c1709a', 'ROBOT_VACUUM', '로보락', 'Qrevo S', ARRAY['Roborock Qrevo S', '도크 340x487x521']::TEXT[], '로보락 Qrevo S', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=65370506","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"dockWidthMm":340,"dockHeightMm":521,"dockDepthMm":487}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_00352baa8943b2b7c635', 'ROBOT_VACUUM', '로보락', 'Qrevo Curv', ARRAY['Roborock Qrevo Curv', '도크 450x450x450']::TEXT[], '로보락 Qrevo Curv', 352, 103, 347, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=71422415","value":{"widthMm":352,"heightMm":103,"depthMm":347,"dockWidthMm":450,"dockHeightMm":450,"dockDepthMm":450}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c859f51803866cfe132c', 'ROBOT_VACUUM', '로보락', 'Q Revo L', ARRAY['Roborock Qrevo L', '도크 340x487x519']::TEXT[], '로보락 Q Revo L', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2025, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=89526515","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"weightKg":3.57,"dockWidthMm":340,"dockHeightMm":519,"dockDepthMm":487}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_c88a06d1961b415cab3c', 'ROBOT_VACUUM', '로보락', 'Q5 Pro', ARRAY['Roborock Q5 Pro', '도크 305x440x448']::TEXT[], '로보락 Q5 Pro', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=28597124","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"weightKg":3,"dockWidthMm":305,"dockHeightMm":440,"dockDepthMm":448}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_ca7fff73c869bf3259cd', 'ROBOT_VACUUM', '로보락', 'Q8 Max+', ARRAY['Roborock Q8 Max Plus', '도크 305x440x448']::TEXT[], '로보락 Q8 Max+', 350, 97, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=28597646","value":{"widthMm":350,"heightMm":96.5,"depthMm":353,"weightKg":3.6,"dockWidthMm":305,"dockHeightMm":440,"dockDepthMm":448}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_1fcd0ed6581225f25d59', 'ROBOT_VACUUM', '에코백스', 'DEEBOT X2 Omni', ARRAY['디봇 X2 옴니', '도크 394x443x527.5']::TEXT[], '에코백스 디봇 X2 옴니', 320, 95, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2023, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=27983015","value":{"widthMm":320,"heightMm":95,"depthMm":353,"weightKg":5,"dockWidthMm":394,"dockHeightMm":527.5,"dockDepthMm":443}},{"tier":1,"url":"https://www.ecovacs.com/kr/deebot-robotic-vacuum-cleaner/deebot-x2-omni","value":{"note":"공식 모델 페이지"}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_da9c8ea2d94525154769', 'ROBOT_VACUUM', '에코백스', 'DEEBOT X1 Omni', ARRAY['디봇 X1 옴니', '도크 430x448x578']::TEXT[], '에코백스 디봇 X1 옴니', 362, 104, 362, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2021, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=16566839","value":{"widthMm":362,"heightMm":103.5,"depthMm":362,"dockWidthMm":430,"dockHeightMm":578,"dockDepthMm":448}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_3b219fb02dc9842a5bb8', 'ROBOT_VACUUM', '에코백스', 'DEEBOT T30 Pro Omni', ARRAY['디봇 T30 프로 옴니 DDX14', '도크 409x490x480']::TEXT[], '에코백스 디봇 T30 프로 옴니', 351, 104, 351, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=44996018","value":{"widthMm":351,"heightMm":104,"depthMm":351,"weightKg":4.1,"dockWidthMm":409,"dockHeightMm":490,"dockDepthMm":480}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_f84369af66109d2a93da', 'ROBOT_VACUUM', '에코백스', 'DEEBOT T30 Omni', ARRAY['디봇 T30 옴니 DDX11', '도크 409x490x480']::TEXT[], '에코백스 디봇 T30 옴니', 353, 104, 351, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=60239207","value":{"widthMm":353,"heightMm":104,"depthMm":351,"weightKg":4.1,"dockWidthMm":409,"dockHeightMm":490,"dockDepthMm":480}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_4194c4e4495f6794437d', 'ROBOT_VACUUM', '에코백스', 'DEEBOT N30 Pro Omni', ARRAY['디봇 N30 프로 옴니', '도크 340x485x540']::TEXT[], '에코백스 디봇 N30 프로 옴니', 353, 104, 353, NULL, NULL, NULL, NULL, '본체 + 자동도크', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=68776505","value":{"widthMm":353,"heightMm":104,"depthMm":353,"dockWidthMm":340,"dockHeightMm":540,"dockDepthMm":485}}]'::JSONB, 1, 'PENDING', NULL, NOW())
ON CONFLICT ("modelCode") DO NOTHING;

INSERT INTO "appliance_specs" ("id", "category", "brand", "modelCode", "modelAliases", "productName", "widthMm", "heightMm", "depthMm", "hingeOpenWidthMm", "ventTopMm", "ventSideMm", "ventBackMm", "doorType", "capacityL", "builtIn", "releaseYear", "discontinued", "sources", "consensusCount", "verifyStatus", "lastVerifiedAt", "updatedAt")
VALUES ('aspc_e3ea521c3e6c72a101db', 'ROBOT_VACUUM', '다이슨', '360 Vis Nav', ARRAY['Dyson 360 Vis Nav', '비즈 나브']::TEXT[], '다이슨 360 Vis Nav', 330, 99, 320, NULL, NULL, NULL, NULL, '본체만', NULL, FALSE, 2024, FALSE, '[{"tier":1,"url":"https://prod.danawa.com/info/?pcode=40711502","value":{"widthMm":330,"heightMm":99,"depthMm":320,"weightKg":4.5}},{"tier":1,"url":"https://www.dyson.co.kr/dyson-360-vis-nav","value":{"note":"공식 모델명 확인"}}]'::JSONB, 2, 'VERIFIED', NOW(), NOW())
ON CONFLICT ("modelCode") DO NOTHING;
