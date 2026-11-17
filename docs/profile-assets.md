# 프로필 이미지 관리

이 저장소의 `README.md`는 GitHub 프로필에 표시됩니다.

| 파일 | 용도 | 수정 방법 |
| --- | --- | --- |
| `assets/profile-banner.svg` | 상단 배너 | SVG를 직접 수정합니다. |
| `assets/toolkit.svg` | 기술 목록 | `scripts/profile-visuals.mjs`의 `renderToolkit`을 수정하고 다시 생성합니다. |
| `assets/activity.svg` | 최근 365일 기여 그래프 | 생성 스크립트 또는 Actions로 갱신합니다. |
| `assets/z-mark-avatar.png` | 아바타 이미지 파일 | GitHub 아바타 변경은 계정 설정에서 별도로 적용합니다. |

## 생성 및 확인

Node.js 22 이상에서 저장소 루트를 기준으로 실행합니다.

```sh
node --test scripts/profile-visuals.test.mjs
node scripts/profile-visuals.mjs
```

생성 후 `git diff -- assets/toolkit.svg assets/activity.svg`로 변경 사항을 확인하고, SVG를 브라우저에서 열어 글자와 그래프를 확인합니다. 자동 생성되는 두 SVG는 생성 스크립트를 수정해야 다음 갱신에도 변경이 유지됩니다.

README의 이미지 경로나 파일명을 변경했다면 이미지 URL과 `alt` 설명도 함께 확인합니다. 배너는 생성 스크립트와 독립적으로 관리됩니다.

환경 변수와 데이터 해석은 [생성 스크립트 안내](../scripts/README.md)를 참고하세요.
