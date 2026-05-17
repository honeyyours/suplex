# 경쟁/유사 서비스 분석

수플렉스 본 제품과 **별개**로, 시장에 존재하는 인테리어 자재 계산기·견적 도구·관리 SaaS를
분석해서 우리 제품에 적용·개선할 인사이트를 수집하는 폴더입니다.

> ⚠️ 분석 목적은 차별화·개선이며, 코드 1:1 복제는 하지 않습니다.
> 산식·UX 발상은 참고하되, Suplex 토큰·아키텍처에 맞게 재설계합니다.

## 폴더 규칙

각 사이트별 폴더:

```
competitor-analysis/
  <사이트-슬러그>/
    README.md         # 분석 문서 (이 사이트 한 정)
    raw/              # 원본 HTML
    assets/           # JS/CSS/SW/manifest 등 다운받은 자산
```

## 분석된 사이트 목록

| 사이트 | 슬러그 | 핵심 | 분석일 |
| --- | --- | --- | --- |
| interior-material-calc.pages.dev | [interior-material-calc](./interior-material-calc/README.md) | 자재 7종 물량 계산기 (PWA, vanilla JS) | 2026-05-17 |
| interior-calculator.vercel.app (스몰테이블) | [interior-calculator](./interior-calculator/README.md) | 자재 6종, 단일 HTML, "7년 현장 경험" 브랜드 | 2026-05-17 |

## 비교 문서

- **[자재 물량 계산기 비교 — A vs B](./COMPARISON.md)** — 산식 1:1 + UX + Suplex 채택 후보안

