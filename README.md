# NewsStand

뉴스스탠드 UI를 개발해 본 후에 MVC 패턴으로 리팩토링 해봄으로써 MVC 패턴에 대해 학습해본다.

#### NewsStand_1
- Object Literal 형식으로 개발한 뉴스스탠드

#### NewsStand_2
- MVC 패턴으로 개발한 뉴스스탠드
- Model은 데이터를 가지고 있으며 Controller의 데이터 변경이나 요청을 처리한다.
- View는 화면의 렌더링을 담당하며 Controller에게 데이터를 넘겨받아 요청을 처리한다.
- Controller는 사용자의 액션에 대한 이벤트를 담당하여 Model과 View를 컨트롤한다.

#### NewsStand_3
- MVC 패턴에 Observer 패턴을 추가한 뉴스스탠드
- Model은 데이터를 가지고 있으며 데이터의 변경이나 요청을 처리한다.
- Model은 데이터의 변경이 있을 시 구독하고 있는 View에게 전파한다.
- View는 화면의 렌더링과 사용자의 액션에 따른 이벤트를 입력받는다.
- View는 Model을 구독하고 있으며 데이터 변경이 있을 시 화면을 다시 렌더링한다.
- View는 이벤트가 들어오면 Controller에게 전파한다.
- Controller는 이벤트의 처리와 데이터 값의 계산을 담당한다.
- Controller는 View를 구독하고 있으며 이벤트를 전파받고 처리한다.
