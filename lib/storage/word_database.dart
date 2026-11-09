import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../models/word_record.dart';

/// The existing device database, upgraded without replacing edited words/bookmarks.
class WordDatabase {
  WordDatabase({this.seedRows = const [], this.factory, this.databasePath});

  final List<Map<String, Object?>> seedRows;
  final DatabaseFactory? factory;
  final String? databasePath;
  late final Database _db;

  Future<void> initialize() async {
    final selectedFactory = factory ?? databaseFactory;
    final path =
        databasePath ??
        p.join(await selectedFactory.getDatabasesPath(), 'word_collector.db');
    _db = await selectedFactory.openDatabase(
      path,
      options: OpenDatabaseOptions(
        version: 2,
        onCreate: (db, version) async {
          await db.execute('''CREATE TABLE terms (
          id TEXT PRIMARY KEY,
          subject TEXT NOT NULL,
          english TEXT NOT NULL,
          korean TEXT NOT NULL,
          summary TEXT NOT NULL,
          formula TEXT NOT NULL,
          important INTEGER NOT NULL,
          bookmarked INTEGER NOT NULL,
          english_definition TEXT NOT NULL,
          korean_definition TEXT NOT NULL,
          explanation TEXT NOT NULL,
          specialization TEXT NOT NULL DEFAULT '',
          example_sentence TEXT NOT NULL DEFAULT '',
          analysis_model TEXT NOT NULL DEFAULT ''
        )''');
          for (final row in seedRows) {
            await db.insert('terms', row);
          }
        },
        onUpgrade: (db, oldVersion, newVersion) async {
          if (oldVersion < 2) {
            await db.execute(
              "ALTER TABLE terms ADD COLUMN specialization TEXT NOT NULL DEFAULT ''",
            );
            await db.execute(
              "ALTER TABLE terms ADD COLUMN example_sentence TEXT NOT NULL DEFAULT ''",
            );
            await db.execute(
              "ALTER TABLE terms ADD COLUMN analysis_model TEXT NOT NULL DEFAULT ''",
            );
          }
        },
      ),
    );
  }

  Future<List<Map<String, Object?>>> getTerms() =>
      _db.query('terms', orderBy: 'rowid ASC');

  Future<void> updateBookmark(String id, bool bookmarked) async {
    final count = await _db.update(
      'terms',
      {'bookmarked': bookmarked ? 1 : 0},
      where: 'id = ?',
      whereArgs: [id],
    );
    if (count != 1) throw StateError('저장된 단어를 찾지 못했습니다.');
  }

  Future<void> updateTerm({
    required String id,
    required String english,
    required String korean,
    required String englishDefinition,
    required String koreanDefinition,
    required String explanation,
    String? specialization,
    String? exampleSentence,
  }) async {
    final count = await _db.update(
      'terms',
      {
        'english': english,
        'korean': korean,
        'summary': koreanDefinition,
        'english_definition': englishDefinition,
        'korean_definition': koreanDefinition,
        'explanation': explanation,
        'specialization': ?specialization,
        'example_sentence': ?exampleSentence,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
    if (count != 1) throw StateError('저장된 단어를 찾지 못했습니다.');
  }

  /// Only the explicitly reviewed draft is inserted. Reference text stays transient.
  Future<void> insertReviewedTerm({
    required WordRecord record,
    required String explanation,
    required String model,
  }) async {
    if ([
      record.id,
      record.notebookName,
      record.englishTerm,
      record.koreanMeaning,
      record.englishDefinition,
      record.koreanDefinition,
      record.exampleSentence,
    ].any((value) => value.trim().isEmpty)) {
      throw ArgumentError('저장할 단어의 필수 항목을 확인해 주세요.');
    }
    await _db.insert('terms', {
      'id': record.id,
      'subject': record.notebookName,
      'english': record.englishTerm,
      'korean': record.koreanMeaning,
      'summary': record.koreanDefinition,
      'formula': '',
      'important': 0,
      'bookmarked': 0,
      'english_definition': record.englishDefinition,
      'korean_definition': record.koreanDefinition,
      'explanation': explanation,
      'specialization': record.specialization,
      'example_sentence': record.exampleSentence,
      'analysis_model': model,
    });
  }

  Future<void> close() => _db.close();
}
