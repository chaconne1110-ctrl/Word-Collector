
/// Word Collector 공통 단어 데이터 모델.
///
/// 기본 데이터 7개 항목과 내부 식별자(id)를 관리합니다.
/// 참고 문맥, 북마크 상태, AI 추가 설명 및 이미지는
/// 이 모델에 포함하지 않습니다.
class WordRecord {
  // 내부 식별자 (XLSX 출력 제외)
  final String id;

  // 기본 데이터 7개 항목
  final String englishTerm;
  final String koreanMeaning;
  final String specialization;
  final String notebookName;
  final String englishDefinition;
  final String koreanDefinition;
  final String exampleSentence;

  const WordRecord({
    required this.id,
    required this.englishTerm,
    required this.notebookName,
    this.koreanMeaning = '',
    this.specialization = '',
    this.englishDefinition = '',
    this.koreanDefinition = '',
    this.exampleSentence = '',
  });

  // XLSX 출력 열 이름
  static const List<String> exportHeaders = [
    '영어 단어',
    '한국어 뜻',
    '전문 분야',
    '단어장 이름',
    '영어 정의',
    '한국어 정의',
    '예문',
  ];

  // XLSX 출력용 데이터
  List<String> toExportRow() {
    return [
      englishTerm,
      koreanMeaning,
      specialization,
      notebookName,
      englishDefinition,
      koreanDefinition,
      exampleSentence,
    ];
  }
}
