import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:word_collector/services/word_analysis_service.dart';

void main() {
  late HttpServer server;
  late List<Map<String, dynamic>> requests;
  late Future<void> Function(HttpRequest) handle;

  Map<String, Object?> success({String notebook = '전자기학'}) => {
    'model': 'gemini-3.5-flash-lite',
    'analysis': {
      'englishTerm': 'Eddy current',
      'koreanMeaning': '와전류',
      'specialization': '전기공학',
      'notebookName': notebook,
      'englishDefinition': 'A circulating current induced in a conductor.',
      'koreanDefinition': '도체 안에 유도되는 순환 전류.',
      'exampleSentence': 'Eddy currents cause heating in a transformer core.',
      'explanation': '변하는 자속에 의해 발생합니다.',
      'recommendationReason': '자기 유도에 관한 단어가 저장되어 있습니다.',
      'relatedTerms': ['Magnetic flux · 자속'],
    },
  };

  final notebooks = <Map<String, Object?>>[
    {
      'name': '전자기학',
      'terms': [
        {
          'englishTerm': 'Magnetic flux',
          'koreanMeaning': '자속',
          'englishDefinition': 'Magnetic field through a surface.',
          'koreanDefinition': '면을 통과하는 자기장.',
        },
      ],
    },
    {'name': '전기기기', 'terms': <Map<String, Object?>>[]},
  ];

  Future<void> respond(
    HttpRequest request,
    Object body, {
    int status = 200,
  }) async {
    request.response.statusCode = status;
    request.response.headers.contentType = ContentType.json;
    request.response.write(jsonEncode(body));
    await request.response.close();
  }

  Future<WordAnalysis> analyze({
    bool autoSubject = true,
    String selectedSubject = '전자기학',
    String word = '와전류',
    Duration timeout = const Duration(seconds: 2),
  }) {
    return WordAnalysisService(
      baseUri: Uri.parse('http://127.0.0.1:${server.port}'),
      timeout: timeout,
    ).analyze(
      word: word,
      referenceText: '변압기 철심에서 발생하는 전류',
      autoSubject: autoSubject,
      selectedSubject: selectedSubject,
      notebooks: notebooks,
    );
  }

  setUp(() async {
    requests = [];
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    handle = (request) => respond(request, success());
    server.listen((request) async {
      try {
        expect(request.method, 'POST');
        expect(request.uri.path, '/api/analyze');
        requests.add(
          jsonDecode(await utf8.decoder.bind(request).join())
              as Map<String, dynamic>,
        );
        await handle(request);
      } on HttpException {
        // A deadline test deliberately disconnects an in-flight response.
      } on SocketException {
        // The service force-closes its socket after the overall deadline.
      }
    });
  });

  tearDown(() async {
    await server.close(force: true);
  });

  test(
    'posts Korean context, notebook meanings and definitions; decodes result',
    () async {
      final result = await analyze();
      expect(requests, hasLength(1));
      expect(requests.single, {
        'word': '와전류',
        'referenceText': '변압기 철심에서 발생하는 전류',
        'autoSubject': true,
        'selectedSubject': '전자기학',
        'notebooks': notebooks,
      });
      expect(result.englishTerm, 'Eddy current');
      expect(result.koreanMeaning, '와전류');
      expect(result.specialization, '전기공학');
      expect(result.notebookName, '전자기학');
      expect(result.koreanDefinition, '도체 안에 유도되는 순환 전류.');
      expect(result.exampleSentence, contains('transformer'));
      expect(result.model, WordAnalysisService.model);
      expect(result.relatedTerms, ['Magnetic flux · 자속']);
      expect(() => result.relatedTerms.add('changed'), throwsUnsupportedError);
    },
  );

  test(
    'direct selection preserves English word and selected notebook',
    () async {
      handle = (request) => respond(request, success(notebook: '전기기기'));
      final result = await analyze(
        word: 'Transformer',
        autoSubject: false,
        selectedSubject: '전기기기',
      );
      expect(requests.single['word'], 'Transformer');
      expect(requests.single['autoSubject'], false);
      expect(requests.single['selectedSubject'], '전기기기');
      expect(result.notebookName, '전기기기');
    },
  );

  test(
    'rejects model switches and incomplete or wrong-type required fields',
    () async {
      handle = (request) async {
        final body = success();
        body['model'] = 'gemini-3.8-flash';
        await respond(request, body);
      };
      await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));

      for (final key in [
        'englishTerm',
        'koreanMeaning',
        'englishDefinition',
        'koreanDefinition',
        'exampleSentence',
        'specialization',
      ]) {
        handle = (request) async {
          final body = success();
          (body['analysis']! as Map<String, Object?>).remove(key);
          await respond(request, body);
        };
        await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));
      }
      handle = (request) async {
        final body = success();
        (body['analysis']! as Map<String, Object?>)['koreanMeaning'] = 12;
        await respond(request, body);
      };
      await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));
    },
  );

  test(
    'permits blank specialization and omitted supplementary explanations',
    () async {
      handle = (request) async {
        final body = success();
        final fields = body['analysis']! as Map<String, Object?>;
        fields['specialization'] = '';
        fields.remove('explanation');
        fields.remove('recommendationReason');
        fields.remove('relatedTerms');
        await respond(request, body);
      };
      final result = await analyze();
      expect(result.specialization, '');
      expect(result.explanation, '');
      expect(result.recommendationReason, '');
      expect(result.relatedTerms, isEmpty);
    },
  );

  test(
    'rejects invented notebook, changed direct notebook and related objects',
    () async {
      handle = (request) => respond(request, success(notebook: '없는 단어장'));
      await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));
      handle = (request) => respond(request, success(notebook: '전기기기'));
      await expectLater(
        analyze(autoSubject: false),
        throwsA(isA<WordAnalysisException>()),
      );
      handle = (request) async {
        final body = success();
        (body['analysis']! as Map<String, Object?>)['relatedTerms'] = [
          {'englishTerm': 'flux'},
        ];
        await respond(request, body);
      };
      await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));
    },
  );

  test(
    'surfaces server quota message, with one request and no retries',
    () async {
      handle = (request) => respond(request, {
        'error': 'Gemini 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
      }, status: 429);
      await expectLater(
        analyze(),
        throwsA(
          isA<WordAnalysisException>().having(
            (error) => error.message,
            'message',
            contains('사용 한도'),
          ),
        ),
      );
      expect(requests, hasLength(1));
    },
  );

  test(
    'one overall deadline covers slow response; no background retry',
    () async {
      final finished = Completer<void>();
      handle = (request) async {
        await Future<void>.delayed(const Duration(milliseconds: 150));
        try {
          await respond(request, success());
        } on HttpException {
          // Expected if the timeout has already closed the client socket.
        } on SocketException {
          // Expected if the timeout has already closed the client socket.
        } finally {
          finished.complete();
        }
      };
      await expectLater(
        analyze(timeout: const Duration(milliseconds: 60)),
        throwsA(
          isA<WordAnalysisException>().having(
            (error) => error.message,
            'message',
            contains('시간이 초과'),
          ),
        ),
      );
      await finished.future;
      expect(requests, hasLength(1));
    },
  );

  test(
    'rejects oversized and malformed success responses instead of fake output',
    () async {
      handle = (request) async {
        request.response.write('x' * (256 * 1024 + 1));
        await request.response.close();
      };
      await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));
      handle = (request) async {
        request.response.write('{broken');
        await request.response.close();
      };
      await expectLater(analyze(), throwsA(isA<WordAnalysisException>()));
    },
  );

  test(
    'invalid word and direct selection fail before making HTTP requests',
    () async {
      await expectLater(
        analyze(word: '   '),
        throwsA(isA<WordAnalysisException>()),
      );
      await expectLater(
        analyze(autoSubject: false, selectedSubject: '없는 단어장'),
        throwsA(isA<WordAnalysisException>()),
      );
      expect(requests, isEmpty);
    },
  );

  test('connection failure becomes a Korean user message', () async {
    final unused = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final port = unused.port;
    await unused.close(force: true);
    await expectLater(
      WordAnalysisService(baseUrl: 'http://127.0.0.1:$port').analyze(
        word: '와전류',
        referenceText: '',
        autoSubject: true,
        selectedSubject: '',
        notebooks: notebooks,
      ),
      throwsA(
        isA<WordAnalysisException>().having(
          (error) => error.message,
          'message',
          contains('분석 서버에 연결할 수 없습니다'),
        ),
      ),
    );
  });
}
