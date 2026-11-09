import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Validated result from the PC server. The seven saved/exported fields are
/// separate from supplementary explanations and classification evidence.
class WordAnalysis {
  WordAnalysis({
    required this.englishTerm,
    required this.koreanMeaning,
    required this.specialization,
    required this.notebookName,
    required this.englishDefinition,
    required this.koreanDefinition,
    required this.exampleSentence,
    required this.explanation,
    required this.recommendationReason,
    required List<String> relatedTerms,
    required this.model,
  }) : relatedTerms = List<String>.unmodifiable(relatedTerms);

  final String englishTerm;
  final String koreanMeaning;
  final String specialization;
  final String notebookName;
  final String englishDefinition;
  final String koreanDefinition;
  final String exampleSentence;
  final String explanation;
  final String recommendationReason;
  final List<String> relatedTerms;
  final String model;
}

class WordAnalysisException implements Exception {
  const WordAnalysisException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// No API key belongs in this client. The server owns Gemini credentials and
/// pins the model. Failed requests never become example/fallback analyses.
class WordAnalysisService {
  WordAnalysisService({
    String? baseUrl,
    Uri? baseUri,
    this.timeout = const Duration(seconds: 35),
  }) : _baseUri = baseUri ?? Uri.parse(baseUrl ?? defaultBaseUrl) {
    if (baseUrl != null && baseUri != null) {
      throw ArgumentError('baseUrl과 baseUri 중 하나만 지정해 주세요.');
    }
    if (!['http', 'https'].contains(_baseUri.scheme) ||
        _baseUri.host.isEmpty ||
        _baseUri.userInfo.isNotEmpty) {
      throw ArgumentError('분석 서버 주소를 확인해 주세요.');
    }
    if (timeout <= Duration.zero) {
      throw ArgumentError('분석 제한 시간은 0보다 커야 합니다.');
    }
  }

  static const model = 'gemini-3.5-flash-lite';
  static const _configuredBaseUrl = String.fromEnvironment(
    'WORDCOLLECTOR_API_URL',
    defaultValue: 'http://10.0.2.2:8787',
  );
  static const _maxResponseBytes = 256 * 1024;

  static String get defaultBaseUrl {
    if (const bool.hasEnvironment('WORDCOLLECTOR_API_URL')) {
      return _configuredBaseUrl;
    }
    return Platform.isAndroid ? _configuredBaseUrl : 'http://127.0.0.1:8787';
  }

  final Uri _baseUri;
  final Duration timeout;

  Future<WordAnalysis> analyze({
    required String word,
    required String referenceText,
    required bool autoSubject,
    required String selectedSubject,
    required List<Map<String, Object?>> notebooks,
  }) async {
    if (word.trim().isEmpty) {
      throw const WordAnalysisException('분석할 단어를 입력해 주세요.');
    }
    final names = <String>{};
    for (final notebook in notebooks) {
      final name = notebook['name'];
      if (name is! String || name.trim().isEmpty || !names.add(name)) {
        throw const WordAnalysisException('단어장 이름을 확인해 주세요.');
      }
    }
    if (names.isEmpty || (!autoSubject && !names.contains(selectedSubject))) {
      throw const WordAnalysisException('분석할 단어장을 선택해 주세요.');
    }

    final client = HttpClient()..connectionTimeout = timeout;
    try {
      return await _send(
        client,
        payload: {
          'word': word.trim(),
          'referenceText': referenceText,
          'autoSubject': autoSubject,
          'selectedSubject': selectedSubject,
          'notebooks': notebooks,
        },
        notebookNames: names,
        autoSubject: autoSubject,
        selectedSubject: selectedSubject,
      ).timeout(timeout);
    } on WordAnalysisException {
      rethrow;
    } on TimeoutException {
      throw const WordAnalysisException('분석 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.');
    } on SocketException {
      throw const WordAnalysisException(
        '분석 서버에 연결할 수 없습니다. PC 서버 실행 상태와 서버 주소를 확인해 주세요.',
      );
    } on TlsException {
      throw const WordAnalysisException('분석 서버의 보안 연결을 확인해 주세요.');
    } on HttpException {
      throw const WordAnalysisException('분석 서버와 통신하지 못했습니다. 다시 시도해 주세요.');
    } on FormatException {
      throw const WordAnalysisException('분석 서버의 응답 형식이 올바르지 않습니다.');
    } on JsonUnsupportedObjectError {
      throw const WordAnalysisException('분석에 보낼 단어장 데이터를 확인해 주세요.');
    } finally {
      // Future.timeout alone does not cancel I/O. Force-close the active client
      // on success, error, and deadline so no request continues in the background.
      client.close(force: true);
    }
  }

  Future<WordAnalysis> _send(
    HttpClient client, {
    required Map<String, Object?> payload,
    required Set<String> notebookNames,
    required bool autoSubject,
    required String selectedSubject,
  }) async {
    final request = await client.postUrl(_baseUri.resolve('/api/analyze'));
    request.followRedirects = false;
    request.headers.contentType = ContentType.json;
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    request.add(utf8.encode(jsonEncode(payload)));
    final response = await request.close();
    if (response.contentLength > _maxResponseBytes) {
      throw const WordAnalysisException('분석 응답이 너무 큽니다. 단어장 범위를 줄여 주세요.');
    }
    final bytes = <int>[];
    await for (final chunk in response) {
      if (bytes.length + chunk.length > _maxResponseBytes) {
        throw const WordAnalysisException('분석 응답이 너무 큽니다. 단어장 범위를 줄여 주세요.');
      }
      bytes.addAll(chunk);
    }

    Object? body;
    try {
      body = jsonDecode(utf8.decode(bytes));
    } on FormatException {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw WordAnalysisException(_statusMessage(response.statusCode));
      }
      rethrow;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = body is Map<String, dynamic> ? body['error'] : null;
      throw WordAnalysisException(
        error is String && error.trim().isNotEmpty
            ? error.trim()
            : _statusMessage(response.statusCode),
      );
    }
    if (body is! Map<String, dynamic> || body['model'] != model) {
      throw const WordAnalysisException('설정된 Gemini 모델과 서버 응답이 일치하지 않습니다.');
    }
    final analysis = body['analysis'];
    if (analysis is! Map<String, dynamic>) {
      throw const WordAnalysisException('분석 결과가 비어 있거나 형식이 올바르지 않습니다.');
    }
    String field(String key, {bool allowBlank = false, bool optional = false}) {
      final value = analysis[key];
      if (optional && value == null) return '';
      if (value is! String || (!allowBlank && value.trim().isEmpty)) {
        throw const WordAnalysisException('필수 분석 항목이 누락됐습니다. 다시 분석해 주세요.');
      }
      return value.trim();
    }

    final notebookName = field('notebookName');
    if (!notebookNames.contains(notebookName) ||
        (!autoSubject && notebookName != selectedSubject)) {
      throw const WordAnalysisException('분석 결과의 단어장이 선택한 단어장과 일치하지 않습니다.');
    }
    final related = analysis['relatedTerms'];
    if (related != null &&
        (related is! List || related.any((value) => value is! String))) {
      throw const WordAnalysisException('추천 근거의 관련 단어 형식이 올바르지 않습니다.');
    }
    return WordAnalysis(
      englishTerm: field('englishTerm'),
      koreanMeaning: field('koreanMeaning'),
      specialization: field('specialization', allowBlank: true),
      notebookName: notebookName,
      englishDefinition: field('englishDefinition'),
      koreanDefinition: field('koreanDefinition'),
      exampleSentence: field('exampleSentence'),
      explanation: field('explanation', allowBlank: true, optional: true),
      recommendationReason: field(
        'recommendationReason',
        allowBlank: true,
        optional: true,
      ),
      relatedTerms: related == null ? <String>[] : List<String>.from(related),
      model: model,
    );
  }

  String _statusMessage(int status) {
    if (status == 429) return '분석 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
    if (status == 408 || status == 504) {
      return '분석 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.';
    }
    return '분석 서버에 오류가 발생했습니다. 다시 시도해 주세요. (HTTP $status)';
  }
}
