import 'package:flutter/material.dart';
import 'models/word_record.dart';
import 'services/word_analysis_service.dart';
import 'storage/word_database.dart';

// Word Collector — Stitch UI 7단계 + SQLite 로컬 저장 적용.
// 홈·단어 목록·플래시카드·북마크·수정·검수 화면은 기존 구조를 유지합니다.
// 예제 단어 수정과 북마크는 기기의 SQLite에 저장되고 앱 재실행 후 복원됩니다.
// Gemini 텍스트 분석은 PC 서버를 통해 요청하고, 검수한 내용만 SQLite에 저장합니다.
// PDF 추출·이미지 생성·사용자별 서버 동기화는 별도 기능입니다.

const Color wcBackground = Color(0xFFFAF8FF);
const Color wcNavy = Color(0xFF00236F);
const Color wcNavyLight = Color(0xFF1E3A8A);
const Color wcText = Color(0xFF131B2E);
const Color wcMutedText = Color(0xFF444651);
const Color wcCardFooter = Color(0xFFF2F3FF);

// 북마크 저장 실패 시 화면 전체에서 오류를 안내하기 위한 메시지 키입니다.
final GlobalKey<ScaffoldMessengerState> _appMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    // 화면 표시 전에 DB를 읽어 앱 재실행 시 저장한 값이 바로 나타나도록 합니다.
    await _demoStore.initialize();
    runApp(const WordCollectorApp());
  } catch (error, stackTrace) {
    debugPrint('Word Collector DB init failed: $error');
    debugPrintStack(stackTrace: stackTrace);
    // 저장 실패를 성공한 것처럼 보여주지 않도록 시작을 중단합니다.
    runApp(const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                '기기 저장소를 열지 못했습니다.\n앱을 다시 실행해주세요.\n'
                '문제가 계속되면 VS Code의 오류 로그를 확인하세요.',
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ),
      ),
    ));
  }
}

class WordCollectorApp extends StatelessWidget {
  const WordCollectorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      scaffoldMessengerKey: _appMessengerKey,
      title: 'Word Collector',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: wcBackground,
        colorScheme: ColorScheme.fromSeed(
          seedColor: wcNavy,
          primary: wcNavy,
          surface: wcBackground,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: wcBackground,
          foregroundColor: wcText,
          elevation: 0,
          centerTitle: false,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class SubjectInfo {
  final String name;
  final String englishName;
  final String description;
  final int wordCount;
  final int bookmarkCount;
  final IconData icon;
  final Color iconBackground;
  final Color iconColor;

  const SubjectInfo({
    required this.name,
    required this.englishName,
    required this.description,
    required this.wordCount,
    required this.bookmarkCount,
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
  });
}

const List<SubjectInfo> sampleSubjects = [
  SubjectInfo(
    name: '전자기학',
    englishName: 'Electromagnetics',
    description: '맥스웰 방정식, 유전율, 정전계 및 자계 전공 용어',
    wordCount: 18,
    bookmarkCount: 3,
    icon: Icons.electric_bolt_rounded,
    iconBackground: Color(0xFFDCE1FF),
    iconColor: Color(0xFF00164E),
  ),
  SubjectInfo(
    name: '회로이론',
    englishName: 'Circuit Theory',
    description: '임피던스, 키르히호프 법칙, 과도현상 및 RLC',
    wordCount: 24,
    bookmarkCount: 4,
    icon: Icons.account_tree_outlined,
    iconBackground: Color(0xFFB3F4D8),
    iconColor: Color(0xFF006C4A),
  ),
  SubjectInfo(
    name: '전기기기',
    englishName: 'Electrical Machinery',
    description: '동기기, 변압기, 유도전동기, 계자권선 전공 어휘',
    wordCount: 15,
    bookmarkCount: 2,
    icon: Icons.precision_manufacturing_outlined,
    iconBackground: Color(0xFFFFDCC3),
    iconColor: Color(0xFF442100),
  ),
  SubjectInfo(
    name: '반도체공학',
    englishName: 'Semiconductor',
    description: '에너지 밴드갭, 페르미 준위, MOSFET 소자 구조',
    wordCount: 8,
    bookmarkCount: 1,
    icon: Icons.memory_rounded,
    iconBackground: Color(0xFFDAE2FD),
    iconColor: Color(0xFF00236F),
  ),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  String _search = '';

  @override
  void initState() {
    super.initState();
    _demoStore.addListener(_onDemoChanged);
  }

  void _onDemoChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _demoStore.removeListener(_onDemoChanged);
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _showNextStep(String feature) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature 화면은 다음 단계에서 연결합니다.'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final visibleSubjects = sampleSubjects.where((subject) {
      final query = _search.trim().toLowerCase();
      return query.isEmpty ||
          subject.name.toLowerCase().contains(query) ||
          subject.englishName.toLowerCase().contains(query) ||
          subject.description.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 68,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFDCE1FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.menu_book_rounded, color: wcNavyLight),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Word Collector',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: '검색창으로 이동',
            icon: const Icon(Icons.search, color: wcMutedText),
            onPressed: () => _searchFocus.requestFocus(),
          ),
          IconButton(
            tooltip: '사용자 설정',
            icon: const Icon(Icons.account_circle_rounded, color: wcNavy),
            onPressed: () => _showNextStep('사용자 설정'),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 30),
        children: [
          TextField(
            controller: _searchController,
            focusNode: _searchFocus,
            onChanged: (value) => setState(() => _search = value),
            decoration: InputDecoration(
              hintText: '전공 과목명 또는 전공 단어 검색...',
              hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF757682)),
              prefixIcon: const Icon(Icons.search, color: wcMutedText),
              suffixIcon: _search.isEmpty
                  ? null
                  : IconButton(
                      tooltip: '검색어 지우기',
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _search = '');
                      },
                    ),
              filled: true,
              fillColor: wcCardFooter,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
          const SizedBox(height: 25),
          const Row(
            children: [
              Icon(Icons.folder_open_outlined, color: wcNavyLight, size: 21),
              SizedBox(width: 7),
              Text(
                '내 전공 단어장',
                style: TextStyle(
                  color: wcText,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          const Text(
            '과목을 탭하여 과목별 단어 목록을 확인하세요.',
            style: TextStyle(color: wcMutedText, fontSize: 12),
          ),
          const SizedBox(height: 17),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '정렬: 과목 등록순',
                style: TextStyle(color: wcMutedText, fontSize: 12),
              ),
              Text(
                '총 ${visibleSubjects.length}개 과목',
                style: const TextStyle(color: wcMutedText, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (visibleSubjects.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 48),
              alignment: Alignment.center,
              child: const Column(
                children: [
                  Icon(Icons.menu_book_outlined, color: wcNavyLight, size: 40),
                  SizedBox(height: 12),
                  Text('검색 결과가 없습니다.', style: TextStyle(fontSize: 16)),
                ],
              ),
            )
          else
            ...visibleSubjects.map(
              (subject) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _SubjectCard(
                  subject: subject,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => _SubjectNextStepScreen(subject: subject),
                      ),
                    );
                  },
                ),
              ),
            ),
          const SizedBox(height: 4),
          const Center(
            child: Text(
              '단어와 북마크는 이 기기의 저장소에서 불러옵니다.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF757682), fontSize: 11),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.large(
        tooltip: '단어 추가',
        shape: const CircleBorder(),
        backgroundColor: wcNavyLight,
        foregroundColor: Colors.white,
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const AddTermScreen(),
            ),
          );
        },
        child: const Icon(Icons.add_rounded, size: 36),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        height: 78,
        color: Colors.white,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _BottomItem(
              icon: Icons.home_outlined,
              label: '홈',
              isSelected: true,
              onPressed: () {},
            ),
            const SizedBox(width: 72),
            _BottomItem(
              icon: Icons.bookmark_border_rounded,
              label: '북마크',
              isSelected: false,
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const _BookmarksScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SubjectCard extends StatelessWidget {
  final SubjectInfo subject;
  final VoidCallback onTap;

  const _SubjectCard({required this.subject, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(19),
      elevation: 1,
      shadowColor: const Color(0x2200236F),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: subject.iconBackground,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(subject.icon, size: 30, color: subject.iconColor),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 7,
                          runSpacing: 2,
                          children: [
                            Text(
                              subject.name,
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w700,
                                color: wcText,
                              ),
                            ),
                            Text(
                              subject.englishName,
                              style: const TextStyle(
                                color: Color(0xFF757682),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          subject.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            height: 1.45,
                            color: wcMutedText,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right_rounded, color: wcMutedText),
                ],
              ),
            ),
            Container(
              width: double.infinity,
              color: wcCardFooter,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Wrap(
                spacing: 12,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.menu_book_outlined, size: 17, color: wcNavyLight),
                      const SizedBox(width: 5),
                      Text(
                        '${_demoStore.termsForSubject(subject.name).length}개 예제 단어',
                        style: const TextStyle(
                          color: wcNavyLight,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.bookmark_outline_rounded,
                          size: 17, color: wcNavyLight),
                      const SizedBox(width: 4),
                      Text(
                        '북마크 ${_demoStore.bookmarkCountForSubject(subject.name)}개',
                        style: const TextStyle(color: wcMutedText, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BottomItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onPressed;

  const _BottomItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onPressed,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: isSelected ? wcNavyLight : wcMutedText, size: 28),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? wcNavyLight : wcMutedText,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// 화면의 기본 예제 데이터입니다. 최초 설치 시 한 번 SQLite에 넣습니다.
// 이후 앱 실행에서는 DB에 기록된 수정 내용을 다시 읽어 표시합니다.
class _DemoTerm {
  final String id;
  final String english;
  final String korean;
  final String summary;
  final String formula;
  final bool important;
  final bool initiallyBookmarked;
  final String specialization;
  final String exampleSentence;

  const _DemoTerm({
    required this.id,
    required this.english,
    required this.korean,
    required this.summary,
    this.formula = '',
    this.important = false,
    this.initiallyBookmarked = false,
    this.specialization = '',
    this.exampleSentence = '',
  });

  _DemoTerm copyWith({String? english, String? korean, String? summary,
      String? specialization, String? exampleSentence}) =>
      _DemoTerm(
        id: id,
        english: english ?? this.english,
        korean: korean ?? this.korean,
        summary: summary ?? this.summary,
        formula: formula,
        important: important,
        initiallyBookmarked: initiallyBookmarked,
        specialization: specialization ?? this.specialization,
        exampleSentence: exampleSentence ?? this.exampleSentence,
      );
}

List<_DemoTerm> _demoTermsForSubject(String subjectName) {
  switch (subjectName) {
    case '전자기학':
      return const [
        _DemoTerm(
          id: 'em_skin',
          english: 'Skin Effect',
          korean: '표피 효과',
          summary: '교류 전류가 흐를 때 도체 표면 근처에 전류 밀도가 집중되는 현상입니다. 주파수가 높을수록 침투 깊이가 얕아집니다.',
          formula: 'δ = √(2ρ / ωμ)',
          important: true,
          initiallyBookmarked: true,
        ),
        _DemoTerm(
          id: 'em_perm',
          english: 'Permittivity',
          korean: '유전율',
          summary: '물질이 전기장에 반응하여 분극되는 특성을 나타내는 물리량입니다.',
          formula: 'ε [F/m]',
          important: true,
        ),
        _DemoTerm(
          id: 'em_lorentz',
          english: 'Lorentz Force',
          korean: '로런츠 힘',
          summary: '전기장과 자기장 안에서 움직이는 전하가 받는 힘입니다.',
          formula: 'F = q(E + v × B)',
          initiallyBookmarked: true,
        ),
        _DemoTerm(
          id: 'em_permeability',
          english: 'Permeability',
          korean: '투자율',
          summary: '물질에서 자기장 세기와 자속 밀도의 관계를 나타내는 물리량입니다.',
          formula: 'μ [H/m]',
        ),
        _DemoTerm(
          id: 'em_poynting',
          english: 'Poynting Vector',
          korean: '포인팅 벡터',
          summary: '전자기 에너지의 흐름 방향과 단위 면적당 전달률을 나타냅니다.',
          formula: 'S = E × H',
        ),
      ];
    case '회로이론':
      return const [
        _DemoTerm(
          id: 'cir_resonance',
          english: 'Resonance Frequency',
          korean: '공진 주파수',
          summary: 'RLC 회로에서 유도성 리액턴스와 용량성 리액턴스가 서로 같아지는 주파수입니다.',
          formula: 'f₀ = 1 / (2π√LC)',
          important: true,
          initiallyBookmarked: true,
        ),
        _DemoTerm(
          id: 'cir_impedance',
          english: 'Impedance',
          korean: '임피던스',
          summary: '교류 회로에서 전압과 전류의 관계를 나타내는 복소수 형태의 저항 성분입니다.',
          formula: 'Z = R + jX',
        ),
        _DemoTerm(
          id: 'cir_transient',
          english: 'Transient Response',
          korean: '과도 응답',
          summary: '회로가 새로운 정상 상태로 이동하는 동안 나타나는 일시적인 응답입니다.',
        ),
      ];
    case '전기기기':
      return const [
        _DemoTerm(
          id: 'mach_armature',
          english: 'Armature Reaction',
          korean: '전기자 반작용',
          summary: '전기자 전류가 만든 자계가 주자속의 분포나 크기에 영향을 미치는 현상입니다.',
          important: true,
          initiallyBookmarked: true,
        ),
        _DemoTerm(
          id: 'mach_transformer',
          english: 'Transformer',
          korean: '변압기',
          summary: '전자기 유도를 이용하여 교류 전압과 전류의 크기를 변환하는 장치입니다.',
        ),
      ];
    case '반도체공학':
      return const [
        _DemoTerm(
          id: 'semi_bandgap',
          english: 'Band Gap',
          korean: '밴드갭',
          summary: '가전자대 꼭대기와 전도대 바닥 사이의 에너지 차이입니다.',
          formula: 'Eᵍ [eV]',
          important: true,
        ),
        _DemoTerm(
          id: 'semi_mosfet',
          english: 'MOSFET',
          korean: '금속 산화막 반도체 전계 효과 트랜지스터',
          summary: '게이트 전압으로 채널의 전도도를 제어하는 전계 효과 트랜지스터입니다.',
        ),
      ];
    default:
      return const [];
  }
}

class _SubjectNextStepScreen extends StatefulWidget {
  final SubjectInfo subject;

  const _SubjectNextStepScreen({required this.subject});

  @override
  State<_SubjectNextStepScreen> createState() => _SubjectNextStepScreenState();
}

class _SubjectNextStepScreenState extends State<_SubjectNextStepScreen> {
  List<_DemoTerm> get _terms => _demoStore.termsForSubject(widget.subject.name);
  String _query = '';
  String _filter = '전체';

  @override
  void initState() {
    super.initState();
    _demoStore.addListener(_onDemoChanged);
  }

  void _onDemoChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _demoStore.removeListener(_onDemoChanged);
    super.dispose();
  }

  List<_DemoTerm> get _visibleTerms {
    final query = _query.trim().toLowerCase();
    return _terms.where((term) {
      final matchesText = query.isEmpty ||
          term.english.toLowerCase().contains(query) ||
          term.korean.toLowerCase().contains(query) ||
          term.summary.toLowerCase().contains(query);
      final matchesFilter = switch (_filter) {
        '중요' => term.important,
        '북마크' => _demoStore.isBookmarked(term.id),
        _ => true,
      };
      return matchesText && matchesFilter;
    }).toList();
  }

  void _toggleBookmark(_DemoTerm term) => _demoStore.toggleBookmark(term.id);

  @override
  Widget build(BuildContext context) {
    final terms = _visibleTerms;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.subject.name,
            style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 32),
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: widget.subject.iconBackground,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(widget.subject.icon,
                    color: widget.subject.iconColor, size: 27),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.subject.name,
                        style: const TextStyle(
                            fontSize: 21, fontWeight: FontWeight.bold)),
                    Text(widget.subject.englishName,
                        style: const TextStyle(
                            color: wcMutedText, fontSize: 12)),
                  ],
                ),
              ),
              Text('${_terms.length}개 예제',
                  style: const TextStyle(color: wcNavyLight, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 18),
          TextField(
            onChanged: (value) => setState(() => _query = value),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search, color: wcNavyLight),
              hintText: '단어 또는 한국어 뜻 검색',
              hintStyle: const TextStyle(fontSize: 13),
              filled: true,
              fillColor: wcCardFooter,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['전체', '중요', '북마크'].map((filter) {
                final selected = filter == _filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(filter),
                    selected: selected,
                    onSelected: (_) => setState(() => _filter = filter),
                    selectedColor: wcNavyLight,
                    backgroundColor: wcCardFooter,
                    showCheckmark: false,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : wcText,
                      fontWeight:
                          selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    side: BorderSide.none,
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('단어 목록',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              Text('표시 ${terms.length}개',
                  style: const TextStyle(color: wcMutedText, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 10),
          if (terms.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 56),
              child: Center(child: Text('표시할 단어가 없습니다.')),
            )
          else
            ...terms.map((term) => _TermListCard(
                  term: term,
                  bookmarked: _demoStore.isBookmarked(term.id),
                  onBookmarkTap: () => _toggleBookmark(term),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => _PreviewFlashcardScreen(
                        terms: List<_DemoTerm>.of(terms),
                        initialIndex: terms.indexOf(term),
                        subject: widget.subject,
                        isBookmarked: _demoStore.isBookmarked,
                        onToggleBookmark: _toggleBookmark,
                      ),
                    ),
                  ),
                )),
          const SizedBox(height: 12),
          const Text(
            '북마크와 수정 내용은 기기에 저장되며 홈·북마크에 함께 반영됩니다.',
            textAlign: TextAlign.center,
            style: TextStyle(color: wcMutedText, fontSize: 11, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _TermListCard extends StatelessWidget {
  final _DemoTerm term;
  final bool bookmarked;
  final VoidCallback onBookmarkTap;
  final VoidCallback onTap;

  const _TermListCard({
    required this.term,
    required this.bookmarked,
    required this.onBookmarkTap,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        elevation: 1,
        shadowColor: const Color(0x1600236F),
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (term.important)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0E6FF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('중요',
                            style: TextStyle(
                                color: wcNavyLight,
                                fontWeight: FontWeight.w700,
                                fontSize: 11)),
                      ),
                    const Spacer(),
                    IconButton(
                      tooltip: bookmarked ? '북마크 해제' : '북마크 설정',
                      onPressed: onBookmarkTap,
                      icon: Icon(
                        bookmarked
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        color: wcNavyLight,
                      ),
                    ),
                  ],
                ),
                Text(term.english,
                    style: const TextStyle(
                        color: wcText,
                        fontSize: 21,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(term.korean,
                    style: const TextStyle(
                        color: wcNavyLight,
                        fontSize: 15,
                        fontWeight: FontWeight.w600)),
                if (term.exampleSentence.isNotEmpty) ...[
              const SizedBox(height: 18),
              const Text('영어 예문', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(term.exampleSentence, style: const TextStyle(height: 1.6)),
            ],
            if (term.formula.isNotEmpty) ...[
                  const SizedBox(height: 9),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 9, vertical: 5),
                    decoration: BoxDecoration(
                      color: wcCardFooter,
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Text(term.formula,
                        style: const TextStyle(
                            color: wcNavyLight, fontSize: 12)),
                  ),
                ],
                const SizedBox(height: 10),
                Text(term.summary,
                    style: const TextStyle(
                        fontSize: 12.5,
                        color: wcMutedText,
                        height: 1.5)),
                const SizedBox(height: 10),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text('단어 보기',
                        style: TextStyle(
                            color: wcNavyLight,
                            fontWeight: FontWeight.w600,
                            fontSize: 12)),
                    SizedBox(width: 3),
                    Icon(Icons.chevron_right_rounded,
                        color: wcNavyLight, size: 20),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// AI 연동 전 UI 점검을 위한 예제 정의와 설명입니다.
// 실제 서비스에서는 이 데이터를 사용자별 분석 결과로 교체합니다.
class _DemoDefinition {
  final String english;
  final String korean;
  final String explanation;

  const _DemoDefinition(this.english, this.korean, this.explanation);
}

const Map<String, _DemoDefinition> _demoDefinitions = {
  'em_skin': _DemoDefinition(
    'The tendency of alternating electric current to concentrate near the surface of a conductor, with current density decreasing toward its center.',
    '교류 전류가 도체의 표면 부근에 집중되고 중심부로 갈수록 전류 밀도가 감소하는 현상.',
    '교류 전류가 변화하면 도체 내부의 자기장도 함께 변하며, 이로 인해 전류 분포가 균일하지 않게 됩니다. 주파수가 높을수록 표피 깊이가 작아질 수 있습니다. 표피 깊이 식은 균질한 양도체 등의 조건을 전제로 사용합니다.',
  ),
  'em_perm': _DemoDefinition(
    'A material property that describes how electric displacement responds to an applied electric field.',
    '인가된 전기장에 대해 전기 변위가 어떻게 반응하는지를 나타내는 물질의 특성.',
    '선형·등방성 매질에서는 D = εE로 표현할 수 있습니다. 유전율은 커패시터의 정전용량과 전기장 분포에 영향을 줍니다.',
  ),
  'em_lorentz': _DemoDefinition(
    'The force acting on a charged particle due to electric and magnetic fields.',
    '전기장과 자기장으로 인해 대전 입자가 받는 힘.',
    '전하 q의 입자가 속도 v로 이동할 때 힘은 F = q(E + v × B)입니다. 자기력 성분은 속도와 자기장 양쪽에 수직입니다.',
  ),
  'em_permeability': _DemoDefinition(
    'A material property relating magnetic flux density to magnetic field strength.',
    '자속 밀도와 자기장 세기의 관계를 나타내는 물질의 특성.',
    '선형·등방성 매질에서는 B = μH입니다. 투자율은 자기 회로의 자기 저항과 인덕턴스에 영향을 줍니다.',
  ),
  'em_poynting': _DemoDefinition(
    'A vector representing the rate of electromagnetic energy flow per unit area.',
    '단위 면적을 통과하는 전자기 에너지 전달률과 그 방향을 나타내는 벡터.',
    '포인팅 벡터 S = E × H의 방향은 전자기 에너지가 전달되는 방향을 나타냅니다. 단위는 W/m²입니다.',
  ),
  'cir_resonance': _DemoDefinition(
    'The frequency at which inductive and capacitive reactances cancel in an ideal RLC circuit.',
    '이상적인 RLC 회로에서 유도성 리액턴스와 용량성 리액턴스가 서로 상쇄되는 주파수.',
    '이상적인 L과 C의 공진 주파수는 f₀ = 1/(2π√LC)입니다. 실제 회로에서는 저항과 부하가 응답에 영향을 줍니다.',
  ),
  'cir_impedance': _DemoDefinition(
    'The complex-valued opposition that a circuit presents to alternating current.',
    '회로가 교류 전류에 대해 나타내는 복소수 형태의 저항 성분.',
    '임피던스는 저항 R과 리액턴스 X를 합쳐 Z = R + jX로 나타낼 수 있습니다. 주파수에 따라 값이 달라질 수 있습니다.',
  ),
  'cir_transient': _DemoDefinition(
    'The time-dependent behavior of a circuit as it changes from one operating state to another.',
    '회로가 하나의 동작 상태에서 다른 상태로 바뀔 때 나타나는 시간 의존적 응답.',
    '스위치를 켜거나 끌 때 커패시터 전압과 인덕터 전류는 일반적으로 즉시 불연속적으로 변하지 않습니다. 과도 응답은 회로의 시정수와 관련됩니다.',
  ),
  'mach_armature': _DemoDefinition(
    'The effect of the magnetic field produced by armature current on the main field of an electric machine.',
    '전기자 전류가 만든 자기장이 전기기기의 주자계에 미치는 영향.',
    '전기자 반작용은 부하에 따라 주자속을 왜곡하거나 크기를 변화시켜 기기의 전압과 토크 특성에 영향을 줄 수 있습니다.',
  ),
  'mach_transformer': _DemoDefinition(
    'An electrical device that transfers alternating-current energy between circuits through electromagnetic induction.',
    '전자기 유도를 통해 회로 사이에서 교류 전기 에너지를 전달하는 장치.',
    '이상적인 변압기는 권수비에 따라 전압비가 정해집니다. 실제 변압기에는 철손, 동손, 누설 자속 등이 존재합니다.',
  ),
  'semi_bandgap': _DemoDefinition(
    'The energy difference between the top of the valence band and the bottom of the conduction band.',
    '가전자대의 최상단과 전도대의 최하단 사이의 에너지 차이.',
    '밴드갭은 반도체의 전기적·광학적 특성을 결정하는 중요한 물리량입니다. 온도와 재료에 따라 값이 달라집니다.',
  ),
  'semi_mosfet': _DemoDefinition(
    'A field-effect transistor whose channel conduction is controlled by the voltage applied to an insulated gate.',
    '절연된 게이트에 인가된 전압으로 채널의 전도 상태를 제어하는 전계 효과 트랜지스터.',
    'MOSFET은 게이트와 채널 사이에 절연층이 있으며, 게이트 전압에 따라 소스와 드레인 사이의 전류를 제어합니다.',
  ),
};


List<Map<String, Object?>> _initialTermRows() => [
  for (final subject in sampleSubjects)
    for (final term in _demoTermsForSubject(subject.name))
      {
        'id': term.id,
        'subject': subject.name,
        'english': term.english,
        'korean': term.korean,
        'summary': term.summary,
        'formula': term.formula,
        'important': term.important ? 1 : 0,
        'bookmarked': term.initiallyBookmarked ? 1 : 0,
        'english_definition': _demoDefinitions[term.id]?.english ?? '',
        'korean_definition': _demoDefinitions[term.id]?.korean ?? '',
        'explanation': _demoDefinitions[term.id]?.explanation ?? '',
      },
];

// 북마크는 단어 복사본이 아니라 같은 id를 참조합니다.
class _DemoBookmarkEntry {
  final SubjectInfo subject;
  final _DemoTerm term;
  const _DemoBookmarkEntry({required this.subject, required this.term});
}

class _DemoTermStore extends ChangeNotifier {
  final WordDatabase _database = WordDatabase(seedRows: _initialTermRows());
  final Map<String, List<_DemoTerm>> _termsBySubject = {
    for (final subject in sampleSubjects) subject.name: <_DemoTerm>[],
  };
  final Set<String> _bookmarkedIds = {};
  final Set<String> _busyBookmarkIds = {};
  final Map<String, _DemoDefinition> _updatedDefinitions = {};

  Future<void> initialize() async {
    await _database.initialize();
    final records = await _database.getTerms();
    for (final record in records) {
      final id = record['id'] as String;
      final subject = record['subject'] as String;
      final terms = _termsBySubject[subject];
      if (terms == null) continue;
      terms.add(_DemoTerm(
        id: id,
        english: record['english'] as String,
        korean: record['korean'] as String,
        summary: record['summary'] as String,
        formula: record['formula'] as String,
        important: (record['important'] as int) == 1,
        initiallyBookmarked: (record['bookmarked'] as int) == 1,
        specialization: record['specialization'] as String,
        exampleSentence: record['example_sentence'] as String,
      ));
      if ((record['bookmarked'] as int) == 1) _bookmarkedIds.add(id);
      _updatedDefinitions[id] = _DemoDefinition(
        record['english_definition'] as String,
        record['korean_definition'] as String,
        record['explanation'] as String,
      );
    }
    notifyListeners();
  }

  List<_DemoTerm> termsForSubject(String subjectName) =>
      List<_DemoTerm>.unmodifiable(_termsBySubject[subjectName] ?? const []);

  bool isBookmarked(String id) => _bookmarkedIds.contains(id);

  int bookmarkCountForSubject(String subjectName) =>
      termsForSubject(subjectName).where((term) => isBookmarked(term.id)).length;

  _DemoTerm? termById(String id) {
    for (final subject in sampleSubjects) {
      for (final term in _termsBySubject[subject.name] ?? const <_DemoTerm>[]) {
        if (term.id == id) return term;
      }
    }
    return null;
  }

  _DemoDefinition? definitionFor(String id) =>
      _updatedDefinitions[id] ?? _demoDefinitions[id];

  List<_DemoBookmarkEntry> bookmarkedEntries() => [
    for (final subject in sampleSubjects)
      for (final term in _termsBySubject[subject.name] ?? const <_DemoTerm>[])
        if (isBookmarked(term.id))
          _DemoBookmarkEntry(subject: subject, term: term),
  ];

  void toggleBookmark(String id) {
    // 빠른 연속 클릭이 저장 순서를 뒤집지 않도록 동일 id의 중복 요청은 무시합니다.
    if (_busyBookmarkIds.contains(id) || termById(id) == null) return;
    _busyBookmarkIds.add(id);
    final newValue = !isBookmarked(id);
    _persistBookmark(id, newValue);
  }

  Future<void> _persistBookmark(String id, bool newValue) async {
    try {
      await _database.updateBookmark(id, newValue);
      if (newValue) {
        _bookmarkedIds.add(id);
      } else {
        _bookmarkedIds.remove(id);
      }
      notifyListeners();
    } catch (error) {
      debugPrint('북마크 DB 저장 오류: $error');
      _appMessengerKey.currentState?.showSnackBar(const SnackBar(
        content: Text('북마크를 저장하지 못했습니다. 다시 시도해 주세요.'),
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      _busyBookmarkIds.remove(id);
    }
  }

  Future<void> updateSavedExample({
    required String subjectName,
    required String termId,
    required String english,
    required String korean,
    required String englishDefinition,
    required String koreanDefinition,
    required String explanation,
    String? specialization,
    String? exampleSentence,
  }) async {
    final terms = _termsBySubject[subjectName];
    if (terms == null) throw StateError('과목을 찾지 못했습니다.');
    final index = terms.indexWhere((term) => term.id == termId);
    if (index < 0) throw StateError('단어를 찾지 못했습니다.');

    // DB에 성공적으로 기록된 뒤 메모리 상태를 갱신합니다.
    await _database.updateTerm(
      id: termId,
      english: english,
      korean: korean,
      englishDefinition: englishDefinition,
      koreanDefinition: koreanDefinition,
      explanation: explanation,
      specialization: specialization,
      exampleSentence: exampleSentence,
    );
    final before = terms[index];
    terms[index] = before.copyWith(
      english: english,
      korean: korean,
      summary: koreanDefinition,
      specialization: specialization,
      exampleSentence: exampleSentence,
    );
    _updatedDefinitions[termId] = _DemoDefinition(
      englishDefinition,
      koreanDefinition,
      explanation,
    );
    notifyListeners();
  }

  List<Map<String, Object?>> analysisNotebooks() => [
    for (final subject in sampleSubjects)
      {
        'name': subject.name,
        'terms': [
          for (final term in termsForSubject(subject.name))
            {
              'englishTerm': term.english,
              'koreanMeaning': term.korean,
              'englishDefinition': definitionFor(term.id)?.english ?? '',
              'koreanDefinition': definitionFor(term.id)?.korean ?? term.summary,
            },
        ],
      },
  ];

  Future<void> saveReviewedTerm(WordRecord record, String explanation, String model) async {
    final terms = _termsBySubject[record.notebookName];
    if (terms == null) throw StateError('저장할 단어장을 찾지 못했습니다.');
    await _database.insertReviewedTerm(record: record, explanation: explanation, model: model);
    terms.add(_DemoTerm(
      id: record.id,
      english: record.englishTerm,
      korean: record.koreanMeaning,
      summary: record.koreanDefinition,
      specialization: record.specialization,
      exampleSentence: record.exampleSentence,
    ));
    _updatedDefinitions[record.id] = _DemoDefinition(
      record.englishDefinition, record.koreanDefinition, explanation,
    );
    notifyListeners();
  }

}

final _DemoTermStore _demoStore = _DemoTermStore();

class _PreviewFlashcardScreen extends StatefulWidget {
  final List<_DemoTerm> terms;
  final int initialIndex;
  final SubjectInfo subject;
  final bool Function(String) isBookmarked;
  final ValueChanged<_DemoTerm> onToggleBookmark;

  const _PreviewFlashcardScreen({
    required this.terms,
    required this.initialIndex,
    required this.subject,
    required this.isBookmarked,
    required this.onToggleBookmark,
  });

  @override
  State<_PreviewFlashcardScreen> createState() => _PreviewFlashcardScreenState();
}

class _PreviewFlashcardScreenState extends State<_PreviewFlashcardScreen> {
  late final PageController _controller;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: _index);
    _demoStore.addListener(_onDemoChanged);
  }

  void _onDemoChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _demoStore.removeListener(_onDemoChanged);
    _controller.dispose();
    super.dispose();
  }

  _DemoTerm get _current =>
      _demoStore.termById(widget.terms[_index].id) ?? widget.terms[_index];

  void _navigate(int delta) {
    final next = _index + delta;
    if (next < 0 || next >= widget.terms.length) return;
    _controller.animateToPage(
      next,
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeInOut,
    );
  }

  void _toggleBookmark() {
    widget.onToggleBookmark(_current);
    setState(() {});
  }

  void _showExplanation() {
    final term = _current;
    final details = _demoStore.definitionFor(term.id);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: wcBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      builder: (sheetContext) => FractionallySizedBox(
        heightFactor: 0.82,
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('추가 설명',
                          style: TextStyle(
                              fontSize: 23,
                              fontWeight: FontWeight.bold,
                              color: wcText)),
                    ),
                    IconButton(
                      tooltip: '닫기',
                      onPressed: () => Navigator.pop(sheetContext),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text('저장된 학습 해설입니다. 내용을 확인하며 학습하세요.',
                    style: TextStyle(color: wcMutedText, fontSize: 12)),
                const SizedBox(height: 20),
                Text(term.english,
                    style: const TextStyle(
                        color: wcNavy, fontSize: 21, fontWeight: FontWeight.bold)),
                const SizedBox(height: 5),
                Text(term.korean,
                    style: const TextStyle(color: wcMutedText, fontSize: 15)),
                const SizedBox(height: 18),
                _InfoPanel(
                  title: '예제 상세 설명',
                  icon: Icons.auto_stories_outlined,
                  content: details?.explanation ?? term.summary,
                ),
                if (term.exampleSentence.isNotEmpty) ...[
              const SizedBox(height: 18),
              const Text('영어 예문', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(term.exampleSentence, style: const TextStyle(height: 1.6)),
            ],
            if (term.formula.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _InfoPanel(
                    title: '관련 수식 또는 기호',
                    icon: Icons.functions,
                    content: term.formula,
                  ),
                ],
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.image_outlined, size: 54, color: wcNavyLight),
                      const SizedBox(height: 12),
                      const Text('학습 이미지 자리',
                          style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: wcText)),
                      const SizedBox(height: 9),
                      Text(
                        '${term.english}의 이미지는 아직 생성되지 않았습니다.\n이미지 생성 API를 연결하면 이곳에 표시됩니다.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: wcMutedText, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final term = _current;
    final count = widget.terms.length;
    final saved = widget.isBookmarked(term.id);
    return Scaffold(
      appBar: AppBar(
        title: const Text('플래시카드',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: saved ? '북마크 해제' : '북마크 설정',
            onPressed: _toggleBookmark,
            icon: Icon(
              saved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
              color: wcNavyLight,
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCE1FF),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(widget.subject.name,
                      style: const TextStyle(
                          color: wcNavy,
                          fontSize: 13,
                          fontWeight: FontWeight.w600)),
                ),
                const Spacer(),
                Text('${_index + 1} / $count',
                    style: const TextStyle(color: wcMutedText, fontSize: 13)),
              ],
            ),
          ),
          Expanded(
            child: PageView.builder(
              controller: _controller,
              itemCount: count,
              onPageChanged: (index) => setState(() => _index = index),
              itemBuilder: (context, index) => _buildTermPage(
                _demoStore.termById(widget.terms[index].id) ?? widget.terms[index],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 7, 16, 9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  tooltip: '이전 단어',
                  onPressed: _index == 0 ? null : () => _navigate(-1),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                const Text('좌우로 넘겨 이전/다음 단어',
                    style: TextStyle(color: wcMutedText, fontSize: 12)),
                IconButton(
                  tooltip: '다음 단어',
                  onPressed: _index == count - 1 ? null : () => _navigate(1),
                  icon: const Icon(Icons.arrow_forward_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
          child: SizedBox(
            height: 54,
            child: FilledButton.icon(
              onPressed: _showExplanation,
              icon: const Icon(Icons.auto_awesome_outlined),
              label: const Text('추가 설명 및 이미지 보기',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              style: FilledButton.styleFrom(
                backgroundColor: wcNavyLight,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTermPage(_DemoTerm term) {
    final definition = _demoStore.definitionFor(term.id);
    return SingleChildScrollView(
      key: ValueKey(term.id),
      padding: const EdgeInsets.fromLTRB(16, 5, 16, 12),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1200236F),
              blurRadius: 11,
              offset: Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(widget.subject.icon, size: 17, color: wcNavyLight),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(widget.subject.name,
                      style: const TextStyle(color: wcMutedText, fontSize: 13)),
                ),
                Text(term.id.startsWith('ai_') ? '검수 완료' : '저장 단어',
                    style: TextStyle(color: wcMutedText, fontSize: 11)),
              ],
            ),
            const SizedBox(height: 24),
            Text(term.english,
                style: const TextStyle(
                    color: wcNavy,
                    fontSize: 31,
                    fontWeight: FontWeight.w800,
                    height: 1.2)),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 17),
              decoration: BoxDecoration(
                color: const Color(0xFFDFE6FF),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Text(term.korean,
                  style: const TextStyle(
                      color: wcNavy,
                      fontSize: 21,
                      fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 25),
            const Text('영어 정의',
                style: TextStyle(
                    color: wcText, fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 9),
            Text(definition?.english ?? term.summary,
                style: const TextStyle(color: wcText, fontSize: 15, height: 1.65)),
            const SizedBox(height: 25),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: wcBackground,
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: const Color(0xFFEAEBF8)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('한국어 정의 (영어 정의 해석)',
                      style: TextStyle(
                          color: wcMutedText,
                          fontSize: 13,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Text(definition?.korean ?? term.summary,
                      style: const TextStyle(
                          color: wcText, fontSize: 15, height: 1.6)),
                ],
              ),
            ),
            if (term.exampleSentence.isNotEmpty) ...[
              const SizedBox(height: 18),
              const Text('영어 예문', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(term.exampleSentence, style: const TextStyle(height: 1.6)),
            ],
            if (term.formula.isNotEmpty) ...[
              const SizedBox(height: 18),
              Row(
                children: [
                  const Icon(Icons.check_circle_outline,
                      size: 18, color: Color(0xFF08784D)),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text('관련 수식·기호: ${term.formula}',
                        style: const TextStyle(color: wcMutedText, fontSize: 12)),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoPanel extends StatelessWidget {
  final String title;
  final IconData icon;
  final String content;

  const _InfoPanel({
    required this.title,
    required this.icon,
    required this.content,
  });

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(
          color: wcCardFooter,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: wcNavyLight, size: 20),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(
                        color: wcNavy,
                        fontSize: 16,
                        fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            Text(content,
                style: const TextStyle(
                    color: wcText, fontSize: 14, height: 1.65)),
          ],
        ),
      );
}



// STEP 6: 북마크 및 예제 단어 수정 화면.
// 홈 목록과 북마크는 같은 단어 ID와 동일 저장소를 참조합니다.
class _BookmarksScreen extends StatefulWidget {
  const _BookmarksScreen();

  @override
  State<_BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<_BookmarksScreen> {
  String _selectedSubject = '전체';

  @override
  void initState() {
    super.initState();
    _demoStore.addListener(_onDemoChanged);
  }

  void _onDemoChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _demoStore.removeListener(_onDemoChanged);
    super.dispose();
  }

  void _openCard(_DemoBookmarkEntry entry) {
    final allInSubject = _demoStore.termsForSubject(entry.subject.name);
    final start = allInSubject.indexWhere((term) => term.id == entry.term.id);
    if (start < 0) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _PreviewFlashcardScreen(
          subject: entry.subject,
          terms: allInSubject,
          initialIndex: start,
          isBookmarked: _demoStore.isBookmarked,
          onToggleBookmark: (term) => _demoStore.toggleBookmark(term.id),
        ),
      ),
    );
  }

  void _editCard(_DemoBookmarkEntry entry) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _EditSavedExampleScreen(
          subject: entry.subject,
          termId: entry.term.id,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final all = _demoStore.bookmarkedEntries();
    final shown = all.where((entry) =>
        _selectedSubject == '전체' ||
        entry.subject.name == _selectedSubject).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('북마크', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Row(children: [
            const Text('북마크 단어장',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: wcText)),
            const SizedBox(width: 9),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFB3F4D8),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text('${all.length}개 저장됨',
                  style: const TextStyle(color: Color(0xFF006C4A), fontWeight: FontWeight.bold)),
            ),
          ]),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: const Color(0xFFE2E7FF),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Icon(Icons.sync_rounded, color: wcNavyLight),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '북마크는 원래 단어를 참조합니다. 여기서 수정하면 홈의 같은 단어에도 반영됩니다.\n수정 내용은 이 기기에 저장됩니다.',
                    style: TextStyle(color: wcNavy, height: 1.5, fontSize: 12.5),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['전체', ...sampleSubjects.map((s) => s.name)].map((name) {
                final selected = name == _selectedSubject;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(name),
                    selected: selected,
                    onSelected: (_) => setState(() => _selectedSubject = name),
                    backgroundColor: wcCardFooter,
                    selectedColor: wcNavyLight,
                    showCheckmark: false,
                    side: BorderSide.none,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : wcText,
                      fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),
          if (shown.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 55, horizontal: 10),
              alignment: Alignment.center,
              child: const Column(children: [
                Icon(Icons.bookmark_border_rounded, color: wcNavyLight, size: 40),
                SizedBox(height: 12),
                Text('이 과목에 북마크한 단어가 없습니다.'),
              ]),
            )
          else
            ...shown.map((entry) {
              final def = _demoStore.definitionFor(entry.term.id);
              return Container(
                margin: const EdgeInsets.only(bottom: 13),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 15),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [BoxShadow(color: Color(0x1400236F), blurRadius: 9)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                        decoration: BoxDecoration(color: wcCardFooter, borderRadius: BorderRadius.circular(8)),
                        child: Text(entry.subject.name,
                            style: const TextStyle(color: wcNavy, fontWeight: FontWeight.w600)),
                      ),
                      const Spacer(),
                      IconButton(
                        tooltip: '북마크 해제',
                        onPressed: () => _demoStore.toggleBookmark(entry.term.id),
                        icon: const Icon(Icons.bookmark_rounded, color: wcNavyLight),
                      ),
                    ]),
                    const SizedBox(height: 7),
                    InkWell(
                      onTap: () => _openCard(entry),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entry.term.english,
                              style: const TextStyle(color: wcText, fontWeight: FontWeight.w800, fontSize: 21)),
                          const SizedBox(height: 4),
                          Text(entry.term.korean,
                              style: const TextStyle(color: wcNavyLight, fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 10),
                          Text(def?.korean ?? entry.term.summary,
                              maxLines: 3, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: wcMutedText, height: 1.45)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(children: [
                      Expanded(child: OutlinedButton.icon(
                        onPressed: () => _editCard(entry),
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        label: const Text('수정'),
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: FilledButton.icon(
                        onPressed: () => _openCard(entry),
                        icon: const Icon(Icons.style_outlined, size: 18),
                        label: const Text('플래시카드'),
                        style: FilledButton.styleFrom(backgroundColor: wcNavyLight),
                      )),
                    ]),
                  ],
                ),
              );
            }),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          height: 72,
          color: Colors.white,
          child: Row(children: [
            _BottomItem(
              icon: Icons.home_outlined, label: '홈', isSelected: false,
              onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
            ),
            Expanded(child: Center(
              child: IconButton.filled(
                tooltip: '단어 추가',
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const AddTermScreen()),
                ),
                icon: const Icon(Icons.add_rounded, size: 28),
                style: IconButton.styleFrom(backgroundColor: wcNavyLight),
              ),
            )),
            _BottomItem(
              icon: Icons.bookmark_rounded, label: '북마크', isSelected: true,
              onPressed: () {},
            ),
          ]),
        ),
      ),
    );
  }
}

class _EditSavedExampleScreen extends StatefulWidget {
  final SubjectInfo subject;
  final String termId;

  const _EditSavedExampleScreen({required this.subject, required this.termId});

  @override
  State<_EditSavedExampleScreen> createState() => _EditSavedExampleScreenState();
}

class _EditSavedExampleScreenState extends State<_EditSavedExampleScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _english;
  late final TextEditingController _korean;
  late final TextEditingController _englishDefinition;
  late final TextEditingController _koreanDefinition;
  late final TextEditingController _explanation;
  late final TextEditingController _specialization;
  late final TextEditingController _example;
  bool _meaningChanged = false;

  @override
  void initState() {
    super.initState();
    final term = _demoStore.termById(widget.termId)!;
    final def = _demoStore.definitionFor(widget.termId);
    _english = TextEditingController(text: term.english);
    _korean = TextEditingController(text: term.korean);
    _englishDefinition = TextEditingController(text: def?.english ?? '');
    _koreanDefinition = TextEditingController(text: def?.korean ?? '');
    _explanation = TextEditingController(text: def?.explanation ?? '');
    _specialization = TextEditingController(text: term.specialization);
    _example = TextEditingController(text: term.exampleSentence);
  }

  @override
  void dispose() {
    _english.dispose();
    _korean.dispose();
    _englishDefinition.dispose();
    _koreanDefinition.dispose();
    _explanation.dispose();
    _specialization.dispose();
    _example.dispose();
    super.dispose();
  }

  Widget _input(String label, TextEditingController controller,
      {int lines = 1, bool meaning = false, bool requiredField = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 17),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: wcText, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            minLines: lines,
            maxLines: lines == 1 ? 1 : null,
            onChanged: (_) {
              if (meaning && !_meaningChanged) setState(() => _meaningChanged = true);
            },
            decoration: InputDecoration(
              filled: true, fillColor: wcCardFooter,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none,
              ),
            ),
            validator: (value) => requiredField && (value == null || value.trim().isEmpty)
                ? '$label 항목을 입력해 주세요.' : null,
          ),
        ],
      ),
    );
  }

  bool _saving = false;

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await _demoStore.updateSavedExample(
        subjectName: widget.subject.name,
        termId: widget.termId,
        english: _english.text.trim(),
        korean: _korean.text.trim(),
        englishDefinition: _englishDefinition.text.trim(),
        koreanDefinition: _koreanDefinition.text.trim(),
        explanation: _explanation.text.trim(),
        specialization: _specialization.text.trim(),
        exampleSentence: _example.text.trim(),
      );
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(const SnackBar(
        content: Text('수정 내용이 기기에 저장되어 홈·북마크에 반영되었습니다.'),
        behavior: SnackBarBehavior.floating,
      ));
    } catch (error) {
      debugPrint('단어 DB 저장 오류: $error');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('저장에 실패했습니다. 내용을 유지한 채 다시 시도해 주세요.'),
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('단어 수정', style: TextStyle(fontWeight: FontWeight.bold))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 28),
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E7FF),
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Text(
                '단어의 수정 내용은 이 기기의 SQLite에 저장됩니다. 서버 동기화는 아직 제공하지 않습니다.',
                style: TextStyle(color: wcNavy, height: 1.5),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(17),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('과목: ${widget.subject.name}',
                      style: const TextStyle(color: wcNavy, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 15),
                  _input('전공', _specialization, requiredField: false),
                  _input('영단어', _english, meaning: true),
                  _input('한국어 뜻', _korean, meaning: true),
                  _input('영어 정의', _englishDefinition, lines: 3, meaning: true),
                  _input('한국어 정의 (영어 정의 해석)', _koreanDefinition, lines: 3, meaning: true),
                  _input('영어 예문', _example, lines: 3, requiredField: false),
                  _input('AI 추가 설명', _explanation, lines: 4, requiredField: false),
                ],
              ),
            ),
            if (_meaningChanged) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: const Color(0xFFFFE8D7), borderRadius: BorderRadius.circular(14)),
                child: const Text(
                  '뜻이나 정의가 변경되었습니다. 예문과 추가 설명도 현재 뜻에 맞는지 확인해 주세요.',
                  style: TextStyle(color: Color(0xFF573115), height: 1.4),
                ),
              ),
            ],
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
          child: SizedBox(
            height: 54,
            child: FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.save_outlined),
              label: Text(_saving ? '기기에 저장 중...' : '수정 내용 저장',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              style: FilledButton.styleFrom(backgroundColor: wcNavyLight),
            ),
          ),
        ),
      ),
    );
  }
}

// STEP 4: Stitch의 단어 추가 화면을 Flutter로 구현한 UI 프로토타입입니다.
// 텍스트 분석·검수·저장은 실제 연결되며 PDF 선택/추출과 이미지는 별도 예제입니다.
// 사용자가 입력한 자료가 실제 분석된 것처럼 표시하지 않습니다.
class AddTermScreen extends StatefulWidget {
  const AddTermScreen({super.key});

  @override
  State<AddTermScreen> createState() => _AddTermScreenState();
}

class _AddTermScreenState extends State<AddTermScreen> {
  final _wordController = TextEditingController();
  final _contextController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _pdfMode = false;
  bool _demoPdfAttached = false;
  bool _autoSubject = true;
  bool _analyzing = false;
  String _selectedSubject = sampleSubjects.first.name;

  @override
  void dispose() {
    _wordController.dispose();
    _contextController.dispose();
    super.dispose();
  }

  void _notice(String text) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(text), behavior: SnackBarBehavior.floating),
      );
  }

  Future<void> _showInputPreview() async {
    if (_analyzing) return;
    if (_pdfMode) {
      FocusScope.of(context).unfocus();
      if (!_demoPdfAttached) {
        _notice('먼저 예제 PDF를 선택하세요. 실제 파일 업로드는 아직 연결되지 않았습니다.');
        return;
      }
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => PdfCandidateSelectionScreen(
            autoSubject: _autoSubject,
            selectedSubject: _selectedSubject,
          ),
        ),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    final word = _wordController.text.trim();
    final reference = _contextController.text.trim();
    final autoSubject = _autoSubject;
    final selectedSubject = _selectedSubject;
    FocusScope.of(context).unfocus();
    setState(() => _analyzing = true);
    try {
      final analysis = await WordAnalysisService().analyze(
        word: word,
        referenceText: reference,
        autoSubject: autoSubject,
        selectedSubject: selectedSubject,
        notebooks: _demoStore.analysisNotebooks(),
      );
      if (!mounted) return;
      await Navigator.of(context).push<void>(MaterialPageRoute<void>(
        builder: (_) => ReviewTermScreen(
          inputWord: word,
          initialSubject: selectedSubject,
          referenceText: reference,
          autoSubject: autoSubject,
          analysis: analysis,
        ),
      ));
    } on WordAnalysisException catch (error) {
      if (mounted) _notice(error.message);
    } catch (_) {
      if (mounted) _notice('분석하지 못했습니다. 입력 내용을 유지한 채 다시 시도해 주세요.');
    } finally {
      if (mounted) setState(() => _analyzing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('단어 추가',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            const Text(
              '학습 용어 수집기',
              style: TextStyle(
                color: wcText, fontSize: 22, fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              '영단어 또는 PDF에서 용어를 가져와 개인 단어장에 등록합니다.',
              style: TextStyle(color: wcMutedText, fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E7FF),
                borderRadius: BorderRadius.circular(15),
              ),
              child: Row(
                children: [
                  _modeButton(
                    label: '직접 입력',
                    icon: Icons.edit_note_rounded,
                    selected: !_pdfMode,
                    onPressed: () => setState(() => _pdfMode = false),
                  ),
                  _modeButton(
                    label: 'PDF 추출',
                    icon: Icons.picture_as_pdf_outlined,
                    selected: _pdfMode,
                    onPressed: () => setState(() => _pdfMode = true),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (!_pdfMode) ...[
              _sectionCard(
                title: '1. 단어 입력',
                icon: Icons.edit_note_rounded,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _AddFieldLabel(text: '단어 (한국어·영어)', requiredField: true),
                    const SizedBox(height: 9),
                    TextFormField(
                      key: const ValueKey('add-word'),
                      controller: _wordController,
                      maxLength: 80,
                      textInputAction: TextInputAction.next,
                      decoration: _inputDecoration(
                        '예: 와전류 또는 Eddy Current',
                      ),
                      validator: (value) => (value == null || value.trim().isEmpty)
                          ? '분석할 단어를 입력하세요.'
                          : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 15),
              _subjectSelector(),
              const SizedBox(height: 15),
              _sectionCard(
                title: '3. 참고자료',
                icon: Icons.description_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _AddFieldLabel(text: '참고 문장 / 교재 문맥'),
                    const SizedBox(height: 8),
                    TextFormField(
                      key: const ValueKey('add-reference'),
                      controller: _contextController,
                      maxLines: 5,
                      minLines: 4,
                      decoration: _inputDecoration(
                        '교재의 문장이나 설명을 입력하세요.\n'
                        '문맥에 맞는 뜻과 정의를 분석할 때 사용합니다.',
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      '참고 문장을 입력하면 해당 문맥을 최우선으로 분석합니다.',
                      style: TextStyle(
                        color: Color(0xFF006C4A), fontSize: 12, height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              _subjectSelector(),
              const SizedBox(height: 16),
              _sectionCard(
                title: 'PDF 참고자료',
                icon: Icons.picture_as_pdf_outlined,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 30,
                      ),
                      decoration: BoxDecoration(
                        color: wcCardFooter,
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: const Color(0xFFDCE1FF)),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.upload_file_outlined,
                              color: wcNavyLight, size: 42),
                          SizedBox(height: 9),
                          Text('PDF 파일을 첨부하세요',
                              style: TextStyle(
                                  color: wcText, fontWeight: FontWeight.w700)),
                          SizedBox(height: 6),
                          Text('추출된 용어를 확인한 후 등록할 단어를 선택합니다.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: wcMutedText,
                                  fontSize: 12,
                                  height: 1.5)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 13),
                    OutlinedButton.icon(
                      onPressed: () => setState(() => _demoPdfAttached = true),
                      icon: const Icon(Icons.attach_file_outlined),
                      label: Text(_demoPdfAttached
                          ? '예제 PDF 다시 선택 (UI 테스트)'
                          : '예제 PDF 선택 (UI 테스트)'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: wcNavyLight,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: Color(0xFFCBD3F2)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(13),
                        ),
                      ),
                    ),
                    if (_demoPdfAttached) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E7FF),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.picture_as_pdf_rounded,
                                color: wcNavyLight, size: 22),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                '전자기학_연습자료.pdf (예제 파일명)\n실제 파일을 첨부하지 않았습니다.',
                                style: TextStyle(fontSize: 12, height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    const Text(
                      '현재 단계는 PDF 첨부·추출의 화면 흐름만 테스트합니다. '
                      '실제 파일 선택과 텍스트 추출은 추후 연결합니다.',
                      style: TextStyle(color: wcMutedText, fontSize: 12, height: 1.5),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: wcCardFooter,
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded, color: wcNavyLight, size: 22),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '분석 결과는 사용자가 검수한 다음에만 개인 단어장에 저장됩니다. '
                      'Gemini 3.5 Flash-Lite로 분석합니다.',
                      style: TextStyle(
                        color: wcMutedText, fontSize: 12, height: 1.6,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          child: SizedBox(
            width: double.infinity,
            height: 54,
            child: FilledButton.icon(
              key: const ValueKey('analyze-word'),
              onPressed: _analyzing ? null : _showInputPreview,
              style: FilledButton.styleFrom(
                backgroundColor: wcNavyLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              icon: const Icon(Icons.auto_awesome_rounded),
              label: Text(_pdfMode
                  ? '추출 단어 목록 보기 (UI 테스트)'
                  : (_analyzing ? 'Gemini 분석 중...' : 'AI 분석 시작')),
            ),
          ),
        ),
      ),
    );
  }

  Widget _modeButton({
    required String label,
    required IconData icon,
    required bool selected,
    required VoidCallback onPressed,
  }) {
    return Expanded(
      child: SizedBox(
        height: 44,
        child: Material(
          color: selected ? wcNavyLight : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon,
                    size: 20,
                    color: selected ? Colors.white : wcMutedText),
                const SizedBox(width: 7),
                Text(label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : wcMutedText,
                    )),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _subjectSelector() => _sectionCard(
    title: _pdfMode ? '1. 분류 선택' : '2. 분류 선택',
    icon: Icons.category_outlined,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: _selectionButton('AI 자동 분류', _autoSubject,
                  () => setState(() => _autoSubject = true)),
            ),
            const SizedBox(width: 7),
            Expanded(
              child: _selectionButton('직접 선택', !_autoSubject,
                  () => setState(() => _autoSubject = false)),
            ),
          ],
        ),
        const SizedBox(height: 13),
        if (_autoSubject)
          const Text(
            '입력 단어와 참고자료를 바탕으로 AI가 과목을 제안합니다. '
            '(현재 AI 미연결)',
            style: TextStyle(color: wcMutedText, fontSize: 12, height: 1.5),
          )
        else ...[
          const _AddFieldLabel(text: '저장할 과목'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: sampleSubjects.map((subject) {
              final selected = subject.name == _selectedSubject;
              return ChoiceChip(
                label: Text(subject.name),
                selected: selected,
                onSelected: (_) => setState(
                  () => _selectedSubject = subject.name,
                ),
                selectedColor: const Color(0xFFDCE1FF),
                backgroundColor: wcCardFooter,
                checkmarkColor: wcNavyLight,
                side: BorderSide.none,
                labelStyle: TextStyle(
                  color: selected ? wcNavy : wcText,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                ),
              );
            }).toList(),
          ),
        ],
      ],
    ),
  );

  Widget _selectionButton(String label, bool selected, VoidCallback action) {
    return OutlinedButton(
      onPressed: action,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 13),
        backgroundColor: selected ? wcNavyLight : wcCardFooter,
        foregroundColor: selected ? Colors.white : wcMutedText,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
    );
  }

  Widget _sectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      boxShadow: const [
        BoxShadow(
          color: Color(0x1000236F), blurRadius: 15, offset: Offset(0, 5),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: wcNavyLight, size: 22),
            const SizedBox(width: 8),
            Expanded(
              child: Text(title,
                  style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w700, color: wcNavy,
                  )),
            ),
          ],
        ),
        const Divider(height: 28, color: Color(0xFFE4E7F4)),
        child,
      ],
    ),
  );

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Color(0xFF757682), fontSize: 13),
    filled: true,
    fillColor: wcCardFooter,
    contentPadding: const EdgeInsets.all(15),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(13),
      borderSide: BorderSide.none,
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(13),
      borderSide: const BorderSide(color: Color(0xFFBA1A1A)),
    ),
  );
}

class _AddFieldLabel extends StatelessWidget {
  final String text;
  final bool requiredField;

  const _AddFieldLabel({required this.text, this.requiredField = false});

  @override
  Widget build(BuildContext context) => Text.rich(
    TextSpan(
      children: [
        TextSpan(text: text),
        if (requiredField)
          const TextSpan(
            text: ' *',
            style: TextStyle(color: Color(0xFFBA1A1A)),
          ),
      ],
    ),
    style: const TextStyle(
      color: wcText,
      fontSize: 13,
      fontWeight: FontWeight.w700,
    ),
  );
}


// STEP 7: PDF 후보 선택 흐름(UI 테스트 전용).
// 아래 후보와 파일명은 예제입니다. 실제 PDF 파일 읽기나 용어 추출은 수행하지 않습니다.
class _PdfDemoCandidate {
  final String id;
  final String english;
  final String korean;
  final String subject;
  final String sampleContext;

  const _PdfDemoCandidate({
    required this.id,
    required this.english,
    required this.korean,
    required this.subject,
    required this.sampleContext,
  });
}

const List<_PdfDemoCandidate> _pdfDemoCandidates = [
  _PdfDemoCandidate(
    id: 'pdf_skin',
    english: 'Skin Effect',
    korean: '표피 효과',
    subject: '전자기학',
    sampleContext: 'Alternating current tends to concentrate near the surface of a conductor.',
  ),
  _PdfDemoCandidate(
    id: 'pdf_perm',
    english: 'Permittivity',
    korean: '유전율',
    subject: '전자기학',
    sampleContext: 'Permittivity describes how a material responds to an applied electric field.',
  ),
  _PdfDemoCandidate(
    id: 'pdf_lorentz',
    english: 'Lorentz Force',
    korean: '로런츠 힘',
    subject: '전자기학',
    sampleContext: 'A charged particle experiences a force in electric and magnetic fields.',
  ),
  _PdfDemoCandidate(
    id: 'pdf_imp',
    english: 'Impedance',
    korean: '임피던스',
    subject: '회로이론',
    sampleContext: 'Impedance relates voltage and current in an AC circuit.',
  ),
  _PdfDemoCandidate(
    id: 'pdf_mos',
    english: 'MOSFET',
    korean: '금속 산화막 반도체 전계 효과 트랜지스터',
    subject: '반도체공학',
    sampleContext: 'The gate voltage controls conduction through the MOSFET channel.',
  ),
];

class PdfCandidateSelectionScreen extends StatefulWidget {
  final bool autoSubject;
  final String selectedSubject;

  const PdfCandidateSelectionScreen({
    super.key,
    required this.autoSubject,
    required this.selectedSubject,
  });

  @override
  State<PdfCandidateSelectionScreen> createState() =>
      _PdfCandidateSelectionScreenState();
}

class _PdfCandidateSelectionScreenState extends State<PdfCandidateSelectionScreen> {
  final Set<String> _checked = <String>{};

  List<_PdfDemoCandidate> get _candidates => widget.autoSubject
      ? _pdfDemoCandidates
      : _pdfDemoCandidates.where((c) => c.subject == widget.selectedSubject).toList();

  @override
  Widget build(BuildContext context) {
    final candidates = _candidates;
    final chosen = candidates.where((c) => _checked.contains(c.id)).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('PDF 추출 단어 확인',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 19)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
        children: [
          _PdfInfoBanner(),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(children: [
              Icon(Icons.picture_as_pdf_rounded, color: wcNavyLight),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('전자기학_연습자료.pdf',
                        style: TextStyle(color: wcText, fontWeight: FontWeight.w700)),
                    SizedBox(height: 4),
                    Text('예제 파일명 · 실제 PDF를 읽은 결과가 아닙니다',
                        style: TextStyle(color: wcMutedText, fontSize: 11)),
                  ],
                ),
              ),
            ]),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: Text('용어 후보 ${candidates.length}개 (예제)',
                  style: const TextStyle(fontSize: 17, color: wcText,
                      fontWeight: FontWeight.w700)),
            ),
            TextButton(
              onPressed: candidates.isEmpty ? null : () => setState(() {
                if (chosen.length == candidates.length) {
                  _checked.clear();
                } else {
                  _checked.addAll(candidates.map((c) => c.id));
                }
              }),
              child: Text(chosen.length == candidates.length && candidates.isNotEmpty
                  ? '전체 해제' : '전체 선택'),
            ),
          ]),
          const SizedBox(height: 8),
          if (candidates.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(child: Text('선택한 과목에 해당하는 예제 후보가 없습니다.')),
            ),
          for (final candidate in candidates) ...[
            _PdfCandidateTile(
              candidate: candidate,
              selected: _checked.contains(candidate.id),
              onChanged: (selected) => setState(() {
                if (selected) {
                  _checked.add(candidate.id);
                } else {
                  _checked.remove(candidate.id);
                }
              }),
            ),
            const SizedBox(height: 10),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
          child: SizedBox(
            height: 54,
            child: FilledButton.icon(
              onPressed: chosen.isEmpty ? null : () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => __PdfSelectedTermsScreen(
                    selected: chosen,
                    autoSubject: widget.autoSubject,
                    selectedSubject: widget.selectedSubject,
                  ),
                ),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: wcNavyLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              icon: const Icon(Icons.fact_check_outlined),
              label: Text('선택한 ${chosen.length}개 단어 검수 목록 (UI 테스트)'),
            ),
          ),
        ),
      ),
    );
  }
}

class _PdfInfoBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(0xFFE2E7FF),
      borderRadius: BorderRadius.circular(16),
    ),
    child: const Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.info_outline_rounded, color: wcNavyLight, size: 22),
        SizedBox(width: 9),
        Expanded(child: Text(
          '현재 목록은 UI 테스트용 예제입니다. 실제 PDF에서 추출한 단어가 아니며 '
          'AI 분석·이미지 생성·저장은 실행되지 않습니다.',
          style: TextStyle(color: wcText, fontSize: 12.5, height: 1.55),
        )),
      ],
    ),
  );
}

class _PdfCandidateTile extends StatelessWidget {
  final _PdfDemoCandidate candidate;
  final bool selected;
  final ValueChanged<bool> onChanged;

  const _PdfCandidateTile({
    required this.candidate,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => onChanged(!selected),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 3),
              child: IgnorePointer(
                child: Checkbox(
                  value: selected,
                  activeColor: wcNavyLight,
                  onChanged: (_) {},
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(candidate.english, style: const TextStyle(
                    color: wcNavy, fontSize: 17, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(candidate.korean, style: const TextStyle(
                    color: wcText, fontWeight: FontWeight.w600)),
                const SizedBox(height: 7),
                Text(candidate.subject,
                    style: const TextStyle(color: wcMutedText, fontSize: 11)),
                const SizedBox(height: 7),
                Text('예제 문장: ${candidate.sampleContext}',
                    style: const TextStyle(
                        color: wcMutedText, fontSize: 12, height: 1.45)),
              ],
            )),
          ],
        ),
      ),
    ),
  );
}

class __PdfSelectedTermsScreen extends StatelessWidget {
  final List<_PdfDemoCandidate> selected;
  final bool autoSubject;
  final String selectedSubject;

  const __PdfSelectedTermsScreen({
    required this.selected,
    required this.autoSubject,
    required this.selectedSubject,
  });

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('선택 단어 검수',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 19)),
    ),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        _PdfInfoBanner(),
        const SizedBox(height: 14),
        Text('${selected.length}개 단어 선택됨',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        const Text('각 단어의 검수 UI를 개별적으로 열 수 있습니다. '
            '현재는 검수 완료 및 일괄 저장 기능을 제공하지 않습니다.',
            style: TextStyle(fontSize: 12, color: wcMutedText, height: 1.5)),
        const SizedBox(height: 15),
        for (final candidate in selected) ...[
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(17),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('검수 전 · UI 테스트',
                    style: TextStyle(color: wcNavyLight, fontSize: 12,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 7),
                Text(candidate.english, style: const TextStyle(
                    color: wcText, fontWeight: FontWeight.w700, fontSize: 17)),
                const SizedBox(height: 3),
                Text(candidate.korean, style: const TextStyle(color: wcMutedText)),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => ReviewTermScreen(
                          inputWord: candidate.english,
                          initialSubject: autoSubject
                              ? candidate.subject : selectedSubject,
                          referenceText: candidate.sampleContext,
                          autoSubject: autoSubject,
                        ),
                      ),
                    ),
                    icon: const Icon(Icons.open_in_new_rounded),
                    label: const Text('통합 검수 화면 열기 (예제)'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    ),
  );
}

// STEP 5: Gemini 결과 검수 및 기기 저장. PDF 경로의 예제는 별도로 표시합니다.
class ReviewTermScreen extends StatefulWidget {
  final String inputWord;
  final String initialSubject;
  final String referenceText;
  final bool autoSubject;
  final WordAnalysis? analysis;

  const ReviewTermScreen({
    super.key,
    required this.inputWord,
    required this.initialSubject,
    required this.referenceText,
    required this.autoSubject,
    this.analysis,
  });

  @override
  State<ReviewTermScreen> createState() => _ReviewTermScreenState();
}

class _ReviewTermScreenState extends State<ReviewTermScreen> {
  final _reviewFormKey = GlobalKey<FormState>();
  final _englishTermController = TextEditingController();
  final _koreanTermController = TextEditingController();
  final _englishDefinitionController = TextEditingController();
  final _koreanDefinitionController = TextEditingController();
  final _explanationController = TextEditingController();
  final _specializationController = TextEditingController();
  final _exampleController = TextEditingController();
  bool _saving = false;

  String? _subject;
  bool _hasSample = false;
  bool _meaningChanged = false;
  bool _reviewConfirmed = false;

  @override
  void initState() {
    super.initState();
    final analysis = widget.analysis;
    if (analysis != null) {
      _subject = analysis.notebookName;
      _englishTermController.text = analysis.englishTerm;
      _koreanTermController.text = analysis.koreanMeaning;
      _englishDefinitionController.text = analysis.englishDefinition;
      _koreanDefinitionController.text = analysis.koreanDefinition;
      _explanationController.text = analysis.explanation;
      _specializationController.text = analysis.specialization;
      _exampleController.text = analysis.exampleSentence;
      return;
    }
    _englishTermController.text = widget.inputWord;
    if (!widget.autoSubject) {
      _subject = widget.initialSubject;
    }

    // 정확하게 일치하는 예제 단어일 때만 해당 예제 내용을 채웁니다.
    // 예제 밖의 단어는 미분석 상태로 비워 둡니다.
    for (final sampleSubject in sampleSubjects) {
      if (!widget.autoSubject && sampleSubject.name != widget.initialSubject) {
        continue;
      }
      for (final term in _demoTermsForSubject(sampleSubject.name)) {
        if (term.english.toLowerCase() != widget.inputWord.trim().toLowerCase()) {
          continue;
        }
        final definition = _demoDefinitions[term.id];
        _subject = sampleSubject.name;
        _koreanTermController.text = term.korean;
        _englishDefinitionController.text = definition?.english ?? '';
        _koreanDefinitionController.text = definition?.korean ?? '';
        _explanationController.text = definition?.explanation ?? '';
        _hasSample = true;
        break;
      }
      if (_hasSample) break;
    }
  }

  @override
  void dispose() {
    _englishTermController.dispose();
    _koreanTermController.dispose();
    _englishDefinitionController.dispose();
    _koreanDefinitionController.dispose();
    _explanationController.dispose();
    _specializationController.dispose();
    _exampleController.dispose();
    super.dispose();
  }

  void _notice(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
  }

  void _markMeaningChanged(String _) {
    if (!_meaningChanged) setState(() => _meaningChanged = true);
    if (_reviewConfirmed) setState(() => _reviewConfirmed = false);
  }

  Future<void> _saveReviewedTerm() async {
    if (_saving) return;
    if (widget.analysis == null) {
      _notice('PDF 예제 미리보기는 저장되지 않습니다. 단어 추가에서 실제 분석을 요청해 주세요.');
      return;
    }
    if (!_reviewFormKey.currentState!.validate() || _subject == null) {
      _notice('필수 항목을 확인해 주세요.');
      return;
    }
    if (!_reviewConfirmed) {
      _notice('먼저 검수 확인 체크박스를 선택해 주세요.');
      return;
    }
    setState(() => _saving = true);
    try {
      final record = WordRecord(
        id: 'ai_${DateTime.now().microsecondsSinceEpoch}',
        englishTerm: _englishTermController.text.trim(),
        koreanMeaning: _koreanTermController.text.trim(),
        specialization: _specializationController.text.trim(),
        notebookName: _subject!,
        englishDefinition: _englishDefinitionController.text.trim(),
        koreanDefinition: _koreanDefinitionController.text.trim(),
        exampleSentence: _exampleController.text.trim(),
      );
      await _demoStore.saveReviewedTerm(record, _explanationController.text.trim(), widget.analysis!.model);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).popUntil((route) => route.isFirst);
      messenger.showSnackBar(SnackBar(content: Text('${record.notebookName} 단어장에 저장했습니다.')));
    } catch (_) {
      if (mounted) _notice('저장하지 못했습니다. 검수 내용을 유지한 채 다시 시도해 주세요.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('통합 검수',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
      ),
      body: Form(
        key: _reviewFormKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            _reviewBanner(),
            const SizedBox(height: 15),
            _reviewCard(
              title: '1. 기본 정보',
              icon: Icons.category_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _AddFieldLabel(text: '과목', requiredField: true),
                  const SizedBox(height: 7),
                  DropdownButtonFormField<String>(
                    key: const ValueKey('review-subject'),
                    initialValue: _subject,
                    isExpanded: true,
                    hint: const Text('과목을 선택하세요'),
                    decoration: _reviewDecoration('과목 선택'),
                    items: sampleSubjects
                        .map((s) => DropdownMenuItem<String>(
                              value: s.name,
                              child: Text(s.name),
                            ))
                        .toList(),
                    onChanged: (value) {
                      setState(() {
                        _subject = value;
                        _reviewConfirmed = false;
                      });
                    },
                    validator: (value) => value == null ? '과목을 선택하세요.' : null,
                  ),
                  const SizedBox(height: 14),
                  _reviewTextField('전공', _specializationController, onChanged: _markMeaningChanged),
                  const SizedBox(height: 14),
                  _reviewTextField('영단어', _englishTermController,
                      requiredField: true, onChanged: _markMeaningChanged),
                  const SizedBox(height: 14),
                  _reviewTextField('한국어 뜻', _koreanTermController,
                      requiredField: true, onChanged: _markMeaningChanged),
                ],
              ),
            ),
            const SizedBox(height: 15),
            _reviewCard(
              title: '2. 정의 및 해석',
              icon: Icons.menu_book_outlined,
              child: Column(
                children: [
                  _reviewTextField('영어 정의', _englishDefinitionController,
                      requiredField: true, minLines: 3,
                      onChanged: _markMeaningChanged),
                  const SizedBox(height: 14),
                  _reviewTextField('한국어 정의 (영어 정의 해석)',
                      _koreanDefinitionController,
                      requiredField: true, minLines: 3,
                      onChanged: _markMeaningChanged),
                  const SizedBox(height: 14),
                  _reviewTextField('영어 예문', _exampleController,
                      requiredField: true, minLines: 3, onChanged: _markMeaningChanged),
                ],
              ),
            ),
            const SizedBox(height: 15),
            _reviewCard(
              title: '3. 추가 설명',
              icon: Icons.auto_awesome_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _reviewTextField('상세 설명', _explanationController,
                      minLines: 5,
                      onChanged: (_) {
                        if (_reviewConfirmed) {
                          setState(() => _reviewConfirmed = false);
                        }
                      }),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () => _notice('추가 설명은 직접 수정할 수 있습니다. 새 분석은 단어 추가에서 요청해 주세요.'),
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('추가 설명만 다시 생성'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 15),
            _reviewCard(
              title: '4. 학습 이미지',
              icon: Icons.image_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                    decoration: BoxDecoration(
                      color: wcCardFooter,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Column(
                      children: [
                        Icon(Icons.image_not_supported_outlined,
                            color: wcNavyLight, size: 43),
                        SizedBox(height: 10),
                        Text('생성된 이미지 없음',
                            style: TextStyle(
                                color: wcText, fontWeight: FontWeight.w700)),
                        SizedBox(height: 7),
                        Text('이미지 생성 API 연결 후 이 위치에 표시됩니다.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: wcMutedText)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => _notice('이미지 다시 생성은 AI 연결 후 사용할 수 있습니다.'),
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('이미지만 다시 생성'),
                  ),
                  const Text('텍스트 분석 결과는 이미지 없이 저장할 수 있습니다.',
                      style: TextStyle(color: wcMutedText, fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 15),
            _reviewCard(
              title: '5. 참고자료 대조',
              icon: Icons.description_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('사용자가 입력한 참고 문장',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 9),
                  Text(
                    widget.referenceText.isEmpty
                        ? '참고 문장을 입력하지 않았습니다.'
                        : widget.referenceText,
                    style: const TextStyle(color: wcMutedText, height: 1.5),
                  ),
                  const SizedBox(height: 12),
                  const Row(
                    children: [
                      Icon(Icons.info_outline_rounded,
                          color: wcNavyLight, size: 16),
                      SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          '원문 검증 및 웹 자료 검색은 아직 수행되지 않았습니다.',
                          style: TextStyle(fontSize: 12, color: wcMutedText),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (_meaningChanged) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFE8D7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '뜻이나 정의가 수정되었습니다. 예문과 추가 설명도 수정된 의미에 맞는지 확인해 주세요.',
                  style: TextStyle(color: Color(0xFF573115), height: 1.5),
                ),
              ),
            ],
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => _notice('새 분석은 단어 추가 화면에서 요청해 주세요. 검수 중 수정한 내용은 새 분석에 자동 반영되지 않습니다.'),
              icon: const Icon(Icons.sync_rounded),
              label: const Text('전체 재분석 요청'),
            ),
            const SizedBox(height: 6),
            CheckboxListTile(
              key: const ValueKey('review-confirm'),
              value: _reviewConfirmed,
              onChanged: (value) => setState(() => _reviewConfirmed = value ?? false),
              title: const Text('텍스트 검수 확인',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              subtitle: const Text('선택한 단어장과 텍스트를 확인했습니다.',
                  style: TextStyle(fontSize: 12)),
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: wcNavyLight,
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
          child: SizedBox(
            height: 54,
            child: FilledButton.icon(
              key: const ValueKey('save-reviewed-word'),
              onPressed: _saving ? null : _saveReviewedTerm,
              icon: const Icon(Icons.bookmark_add_outlined),
              label: Text(_saving ? '기기에 저장 중...' : '개인 단어장 저장',
                  style: TextStyle(fontWeight: FontWeight.w700)),
              style: FilledButton.styleFrom(
                backgroundColor: wcNavyLight,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _reviewBanner() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFFE2E7FF),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.fact_check_outlined, color: wcNavyLight),
            SizedBox(width: 9),
            Text('통합 검수 · 임시 상태',
                style: TextStyle(
                    color: wcNavy, fontSize: 17, fontWeight: FontWeight.w700)),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          widget.analysis != null
              ? '${widget.analysis!.model} 분석 결과입니다. 저장 전에 내용을 확인해 주세요.'
              : (_hasSample ? '기존 UI 예제이며 AI 분석 결과가 아닙니다.' : 'PDF 예제 미리보기입니다. 실제 분석 결과가 아닙니다.'),
          style: const TextStyle(color: wcMutedText, fontSize: 12, height: 1.5),
        ),
        if (widget.analysis != null) ...[
          const SizedBox(height: 8),
          Text(widget.autoSubject
              ? 'AI 추천 단어장: ${widget.analysis!.notebookName}'
              : '분석 기준: 참고 문장 최우선 · 저장 위치: 직접 선택한 단어장',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          if (widget.autoSubject) ...[
            const SizedBox(height: 6),
            Text(widget.analysis!.recommendationReason,
                style: const TextStyle(color: wcMutedText, fontSize: 12, height: 1.5)),
            if (widget.analysis!.relatedTerms.isNotEmpty)
              Text('관련 저장 단어: ${widget.analysis!.relatedTerms.join(', ')}',
                  style: const TextStyle(color: wcMutedText, fontSize: 12)),
          ],
        ],
      ],
    ),
  );

  Widget _reviewCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(17),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(19),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0D00236F), blurRadius: 12, offset: Offset(0, 5)),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: wcNavyLight, size: 21),
            const SizedBox(width: 8),
            Expanded(
              child: Text(title,
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w700,
                      color: wcNavy)),
            ),
          ],
        ),
        const Divider(height: 26, color: Color(0xFFE4E7F4)),
        child,
      ],
    ),
  );

  Widget _reviewTextField(
    String label,
    TextEditingController controller, {
    bool requiredField = false,
    int minLines = 1,
    ValueChanged<String>? onChanged,
  }) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _AddFieldLabel(text: label, requiredField: requiredField),
      const SizedBox(height: 8),
      TextFormField(
        key: ValueKey('review-$label'),
        controller: controller,
        minLines: minLines,
        maxLines: minLines == 1 ? 1 : null,
        onChanged: onChanged,
        decoration: _reviewDecoration('직접 수정할 수 있습니다.'),
        validator: requiredField
            ? (value) => value == null || value.trim().isEmpty
                ? '$label 항목을 입력하세요.'
                : null
            : null,
      ),
    ],
  );

  InputDecoration _reviewDecoration(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Color(0xFF757682), fontSize: 12),
    filled: true,
    fillColor: wcCardFooter,
    contentPadding: const EdgeInsets.all(14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
  );
}
