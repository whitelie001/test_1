import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/app/app.dart';

void main() {
  testWidgets('앱이 부팅되면 로그인 화면이 보인다', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: PiumApp()));

    expect(find.text('pium'), findsOneWidget);
    expect(find.text('카카오로 로그인'), findsOneWidget);
  });
}
