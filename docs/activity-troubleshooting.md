# 활동 그래프 갱신 문제 해결

활동 그래프는 `assets/activity.svg`에 저장되며, [Update profile visuals](https://github.com/Z3NMA/Z3NMA/actions/workflows/main.yml) 워크플로가 갱신합니다.

## 수동 갱신

1. 저장소의 Actions에서 **Update profile visuals**를 선택합니다.
2. **Run workflow**에서 `main` 브랜치를 선택하고 실행합니다.
3. `Validate renderer`, `Render profile visuals`, `Commit updated visuals` 단계 결과를 확인합니다.
4. `assets/activity.svg`의 변경 이력과 프로필 표시를 비교합니다. 생성 결과가 같으면 새 커밋은 생기지 않습니다.

예약 실행 시각은 매일 00:00 UTC(한국 시간 09:00)입니다. 실제 실행은 지연될 수 있습니다. 현재 push 트리거는 생성 스크립트, 테스트 파일, 워크플로 파일 변경에만 적용되므로 README나 문서만 수정하면 실행되지 않습니다.

## 증상별 확인

| 증상 | 확인할 내용 |
| --- | --- |
| 검증 단계 실패 | `node --test scripts/profile-visuals.test.mjs`의 실패 내용을 확인합니다. |
| 생성 단계 실패 | GitHub 기여 캘린더 요청 또는 HTML 파싱 오류를 확인합니다. 실패 시 이전 이미지가 유지됩니다. |
| 커밋/푸시 실패 | Actions 로그와 저장소의 쓰기 권한·브랜치 규칙을 확인합니다. |
| 파일은 최신인데 프로필은 이전 모습 | 이미지 캐시 반영을 기다리고 README가 올바른 파일 경로를 가리키는지 확인합니다. |
| 커밋 수와 그래프가 다름 | 그래프는 커밋만이 아닌 GitHub 기여 캘린더의 최근 365일을 사용합니다. |

파싱 실패를 해결할 때 실제 기여 데이터를 빈 값이나 예시 데이터로 대체하지 않습니다. 재현을 위해 저장한 기여 캘린더 HTML은 `CONTRIBUTIONS_HTML`로 지정할 수 있습니다. `PROFILE_DATE`를 지정한다면 해당 날짜까지의 365일이 입력 HTML에 포함되어야 합니다.

환경 변수의 전체 설명은 [생성 스크립트 안내](../scripts/README.md), 이미지별 수정 방법은 [프로필 이미지 관리](profile-assets.md)를 참고하세요.
