# 별똥별 받기 (Star Catcher)

60초 동안 떨어지는 별똥별을 받는 작은 브라우저 게임입니다.
[hello-ai 가이드](https://amecoder.github.io/hello-llm/) 심화 과정 「내 서비스 만들기」의 게임 트랙 예시입니다.

- 해 보기: https://amecoder.github.io/star-catcher/
- 설명서: [SPEC.md](SPEC.md)

## 파일

| 파일 | 하는 일 |
|---|---|
| `index.html` | 화면 뼈대와 링크 미리보기 정보 |
| `style.css` | 색·글꼴·배치 |
| `logic.js` | 게임 규칙(점수·목숨·시간). 화면과 떨어져 있어 테스트할 수 있다 |
| `game.js` | 그리기·입력·공유 버튼 |
| `og.html` → `og-image.png` | 링크 미리보기 그림의 원본과 결과 |
| `tests/logic.test.js` | 규칙 테스트 |

## 내 컴퓨터에서 해 보기

```bash
python3 -m http.server 8000   # 이 폴더에서 실행한 뒤 http://localhost:8000 열기
npm test                      # 규칙 테스트 (Node 22 이상)
```

`index.html` 을 더블클릭해서 열면 동작하지 않습니다. `game.js` 가 모듈 방식으로 `logic.js` 를 불러오는데, 브라우저는 파일로 연 페이지에서 이것을 막기 때문입니다.

## 라이선스

MIT
