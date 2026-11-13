import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:word_collector/main.dart';
import 'package:word_collector/services/word_analysis_service.dart';

void main() {
  WordAnalysis result() => WordAnalysis(
    englishTerm: 'eddy current',
    koreanMeaning: '와전류',
    specialization: '전기공학',
    notebookName: '전자기학',
    englishDefinition: 'A circulating induced current.',
    koreanDefinition: '순환하는 유도 전류.',
    exampleSentence: 'Eddy currents heat conductors.',
    explanation: '전자기 유도에 의한 현상입니다.',
    recommendationReason: '저장된 자기장 관련 용어와 부합합니다.',
    relatedTerms: ['Skin Effect'],
    model: 'gemini-3.5-flash-lite',
  );
  Future<void> open(WidgetTester tester, {WordAnalysis? analysis}) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReviewTermScreen(
          inputWord: '와전류',
          initialSubject: '전기기기',
          referenceText: '교재의 참고 문장',
          autoSubject: true,
          analysis: analysis,
        ),
      ),
    );
  }

  testWidgets(
    'API recommendation populates review; changing destination preserves edited analysis',
    (tester) async {
      await open(tester, analysis: result());
      expect(find.text('AI 추천 단어장: 전자기학'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.byKey(const ValueKey('review-영단어')),
        200,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.enterText(
        find.byKey(const ValueKey('review-영단어')),
        'Revised Eddy Current',
      );
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pumpAndSettle();
      await tester.scrollUntilVisible(
        find.byKey(const ValueKey('review-subject')),
        -200,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('review-subject')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('전기기기').last);
      await tester.pumpAndSettle();
      final state = tester.state<FormFieldState<String>>(
        find.byKey(const ValueKey('review-subject')),
      );
      expect(state.value, '전기기기');
      final field = tester.widget<TextFormField>(
        find.byKey(const ValueKey('review-영단어')),
      );
      expect(field.controller!.text, 'Revised Eddy Current');
      await tester.scrollUntilVisible(
        find.byKey(const ValueKey('review-영어 예문')),
        250,
        scrollable: find.byType(Scrollable).first,
      );
      expect(
        tester
            .widget<TextFormField>(find.byKey(const ValueKey('review-영어 예문')))
            .controller!
            .text,
        'Eddy currents heat conductors.',
      );
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('saving requires explicit review confirmation', (tester) async {
    await open(tester, analysis: result());
    await tester.tap(find.byKey(const ValueKey('save-reviewed-word')));
    await tester.pumpAndSettle();
    expect(find.text('먼저 검수 확인 체크박스를 선택해 주세요.'), findsOneWidget);
    expect(find.byType(ReviewTermScreen), findsOneWidget);
  });

  testWidgets('PDF example cannot be saved as a real AI result', (
    tester,
  ) async {
    await open(tester);
    await tester.tap(find.byKey(const ValueKey('save-reviewed-word')));
    await tester.pumpAndSettle();
    expect(
      find.text('PDF 예제 미리보기는 저장되지 않습니다. 단어 추가에서 실제 분석을 요청해 주세요.'),
      findsOneWidget,
    );
  });
}
