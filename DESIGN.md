# Machalmap Design System

## 1. Atmosphere & Identity

마찰지도는 일상 속 불편을 빠르게 확인하고 제보하는 생활 안전 지도다. 사용감은 차분하고 실용적이어야 하며, 시민 제보가 지도와 커뮤니티 사이에서 자연스럽게 이어지는 느낌을 준다. 시그니처는 선명한 파란색 액션과 얕은 표면 깊이로, 복잡한 정보도 모바일에서 바로 스캔할 수 있게 만드는 것이다.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Accent/primary | `--color-primary` | `#2563EB` | N/A | 주요 CTA, 활성 탭, 링크 |
| Accent/hover | `--color-primary-dark` | `#1D4ED8` | N/A | 주요 CTA hover |
| Surface/page | `--color-bg` | `#FFFFFF` | N/A | 기본 배경 |
| Surface/subtle | `--color-surface` | `#F8FAFC` | N/A | 보조 버튼, 필터, 비활성 탭 표면 |
| Text/primary | `--color-text` | `#0F172A` | N/A | 본문, 제목 |
| Text/muted | `--color-text-muted` | `#64748B` | N/A | 보조 텍스트, 비활성 메뉴 |
| Border/default | `--color-border` | `#E2E8F0` | N/A | 구분선, 컨테이너 경계 |
| Marker/danger | `--marker-danger` | `#EF4444` | N/A | 위험 마커 |
| Marker/warn | `--marker-warn` | `#F97316` | N/A | 보행 불편 마커 |
| Marker/facility | `--marker-facility` | `#3B82F6` | N/A | 시설 고장 마커 |
| Marker/env | `--marker-env` | `#22C55E` | N/A | 쓰레기/환경 마커 |
| Marker/resolved | `--marker-resolved` | `#9CA3AF` | N/A | 해결된 제보 |
| Marker/etc | `--marker-etc` | `#8B5CF6` | N/A | 기타 마커 |

### Rules

- 파란색은 현재 위치, 주요 행동, 활성 상태에만 사용한다.
- 정보 구분은 `surface`, `line`, 얕은 shadow 조합으로 처리한다.
- 새 색상이 필요하면 `globals.css`, `tailwind.config.ts`, 이 문서를 함께 갱신한다.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 20px / 1.25rem | 700 | 1.4 | 0 | 앱 타이틀, 페이지 제목 |
| H2 | 18px / 1.125rem | 700 | 1.4 | 0 | 섹션 제목 |
| Body | 16px / 1rem | 400-600 | 1.5 | 0 | 기본 텍스트, 입력 |
| Body/sm | 14px / 0.875rem | 400-600 | 1.5 | 0 | 보조 텍스트, 버튼 |
| Caption | 12px / 0.75rem | 500-600 | 1.4 | 0 | 탭 라벨, 배지, 메타 정보 |

### Font Stack

- Primary: Pretendard, system-ui, sans-serif

### Rules

- 본문과 인터랙션 텍스트는 12px 미만으로 내려가지 않는다.
- 모바일에서 라벨이 줄바꿈되면 아이콘과 라벨을 세로로 정렬해 안정적인 터치 영역을 유지한다.

## 4. Spacing & Layout

### Base Unit

모든 간격은 4px 단위 Tailwind spacing scale을 따른다.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | 아이콘과 라벨 사이 |
| `space-2` | 8px | 컴팩트한 내부 간격 |
| `space-3` | 12px | 작은 패널 padding |
| `space-4` | 16px | 기본 화면 여백 |
| `space-5` | 20px | 모바일 좌우 여백 |
| `space-6` | 24px | 카드/섹션 간격 |
| `space-8` | 32px | 큰 그룹 간격 |

### Grid

- Primary surface width: mobile-first, full width.
- Bottom navigation content width: full width with `max-w-md` to keep thumb navigation compact on wide screens.
- Breakpoints follow Tailwind defaults.

### Rules

- 주요 모바일 고정 UI는 safe-area를 고려한다.
- 지도 화면의 플로팅 버튼과 하단 네비게이션이 겹치지 않게 `body` 하단 여백을 유지한다.

## 5. Components

### Bottom Navigation

- Structure: fixed bottom `<nav>` with three route links.
- Variants: active tab, inactive tab.
- Spacing: `h-16`, `px-3`, `py-2`, `gap-1`.
- States: hover, active, focus-visible, current page.
- Accessibility: each tab is a link and active route uses `aria-current="page"`.
- Motion: color/background changes use 200ms transitions.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 150ms | ease-out | Press feedback |
| Standard | 200ms | ease-in-out | Tab state changes, hover |

### Rules

- Interactive elements include hover, active, and focus-visible states.
- Prefer transform and opacity for tactile feedback.
- Do not animate layout properties.

## 7. Depth & Surface

### Strategy

Machalmap uses a mixed but restrained strategy: thin borders for persistent structure and shallow shadows for floating action surfaces.

| Level | Value | Usage |
|-------|-------|-------|
| Card | `0 1px 3px rgba(0,0,0,0.08)` | active tabs, small elevated surfaces |
| Float | `0 4px 16px rgba(0,0,0,0.16)` | map FAB, elevated panels |
| Border | `1px solid var(--color-border)` | bottom nav edge, dividers |

### Rules

- Persistent navigation can use a border plus subtle translucent surface.
- Shadows should not overpower map content or report markers.
