import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:word_collector/models/word_record.dart';
import 'package:word_collector/storage/word_database.dart';

void main() {
  sqfliteFfiInit();
  late Directory directory;
  late String path;
  setUp(() async {
    directory = await Directory.systemTemp.createTemp('word-collector-db-');
    path = '${directory.path}/words.db';
  });
  tearDown(() async => directory.delete(recursive: true));

  final seed = <String, Object?>{
    'id': 'existing',
    'subject': '전자기학',
    'english': 'Edited word',
    'korean': '수정한 뜻',
    'summary': '기존 정의',
    'formula': '',
    'important': 1,
    'bookmarked': 1,
    'english_definition': 'Edited definition.',
    'korean_definition': '수정한 정의.',
    'explanation': '기존 해설',
  };
  const reviewed = WordRecord(
    id: 'reviewed',
    englishTerm: 'Transformer',
    koreanMeaning: '트랜스포머',
    specialization: '인공지능',
    notebookName: '전기기기',
    englishDefinition: 'A self-attention neural network architecture.',
    koreanDefinition: '자기 주의 집중 신경망 구조.',
    exampleSentence: 'The Transformer processes language.',
  );

  test(
    'version 1 upgrade retains edited terms and bookmarks without reseeding',
    () async {
      final old = await databaseFactoryFfi.openDatabase(
        path,
        options: OpenDatabaseOptions(
          version: 1,
          onCreate: (db, _) => db.execute('''CREATE TABLE terms (
        id TEXT PRIMARY KEY, subject TEXT NOT NULL, english TEXT NOT NULL,
        korean TEXT NOT NULL, summary TEXT NOT NULL, formula TEXT NOT NULL,
        important INTEGER NOT NULL, bookmarked INTEGER NOT NULL,
        english_definition TEXT NOT NULL, korean_definition TEXT NOT NULL,
        explanation TEXT NOT NULL)'''),
        ),
      );
      await old.insert('terms', seed);
      await old.close();
      final db = WordDatabase(
        factory: databaseFactoryFfi,
        databasePath: path,
        seedRows: [
          {...seed, 'id': 'must-not-reseed'},
        ],
      );
      await db.initialize();
      final rows = await db.getTerms();
      expect(rows, hasLength(1));
      expect(rows.single['english'], 'Edited word');
      expect(rows.single['bookmarked'], 1);
      expect(rows.single['english_definition'], 'Edited definition.');
      expect(rows.single['specialization'], '');
      expect(rows.single['example_sentence'], '');
      await db.close();
    },
  );

  test('reviewed seven fields and chosen destination survive close/reopen and edits', () async {
    final db = WordDatabase(
      factory: databaseFactoryFfi,
      databasePath: path,
      seedRows: [seed],
    );
    await db.initialize();
    await db.insertReviewedTerm(
      record: reviewed,
      explanation: '검수한 설명',
      model: 'gemini-3.5-flash-lite',
    );
    await db.close();
    final reopened = WordDatabase(
      factory: databaseFactoryFfi,
      databasePath: path,
      seedRows: [],
    );
    await reopened.initialize();
    var rows = await reopened.getTerms();
    final row = rows.singleWhere((row) => row['id'] == 'reviewed');
    expect(row['subject'], '전기기기');
    expect(row['specialization'], '인공지능');
    expect(row['example_sentence'], reviewed.exampleSentence);
    expect(row['analysis_model'], 'gemini-3.5-flash-lite');
    expect(row.containsKey('referenceText'), isFalse);
    expect(rows.first['bookmarked'], 1);
    await reopened.updateTerm(
      id: 'reviewed',
      english: 'Revised Transformer',
      korean: '수정 뜻',
      englishDefinition: 'Revised definition.',
      koreanDefinition: '수정 정의.',
      explanation: '수정 해설',
      specialization: 'AI',
      exampleSentence: 'A revised example.',
    );
    rows = await reopened.getTerms();
    final updated = rows.singleWhere((row) => row['id'] == 'reviewed');
    expect(updated['english'], 'Revised Transformer');
    expect(updated['example_sentence'], 'A revised example.');
    expect(updated['specialization'], 'AI');
    expect(updated['analysis_model'], 'gemini-3.5-flash-lite');
    expect(reviewed.toExportRow(), [
      '인공지능',
      '전기기기',
      'Transformer',
      '트랜스포머',
      reviewed.englishDefinition,
      reviewed.koreanDefinition,
      reviewed.exampleSentence,
    ]);
    await reopened.close();
  });

  test('duplicate or invalid review cannot overwrite existing data', () async {
    final db = WordDatabase(factory: databaseFactoryFfi, databasePath: path);
    await db.initialize();
    await db.insertReviewedTerm(
      record: reviewed,
      explanation: '',
      model: 'gemini-3.5-flash-lite',
    );
    await expectLater(
      db.insertReviewedTerm(
        record: reviewed,
        explanation: 'overwrite',
        model: 'other',
      ),
      throwsA(isA<DatabaseException>()),
    );
    await expectLater(
      db.insertReviewedTerm(
        record: const WordRecord(
          id: 'bad',
          englishTerm: 'empty',
          notebookName: '전자기학',
        ),
        explanation: '',
        model: '',
      ),
      throwsArgumentError,
    );
    final rows = await db.getTerms();
    expect(rows, hasLength(1));
    expect(rows.single['explanation'], '');
    expect(rows.single['analysis_model'], 'gemini-3.5-flash-lite');
    await db.close();
  });
}
