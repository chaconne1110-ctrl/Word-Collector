import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

// Run: flutter run -t lib/mvp/main.dart
const apiBase = String.fromEnvironment('WC_API_URL');
const apiKey = String.fromEnvironment('WC_ANON_KEY');
const fields = ['영어 용어', '한국어 뜻', '전공', '과목명', '영어 정의', '한국어 정의', '예문'];
const keys = ['englishTerm', 'koreanMeaning', 'specialization', 'notebookName',
  'englishDefinition', 'koreanDefinition', 'exampleSentence'];

class Store {
  static late Database db;
  static Future<void> init() async {
    db = await openDatabase(p.join(await getDatabasesPath(), 'wc_mvp.db'),
      version: 1, onCreate: (d, v) async {
        await d.execute('CREATE TABLE words (id INTEGER PRIMARY KEY AUTOINCREMENT, '
          'data TEXT NOT NULL, bookmarked INTEGER NOT NULL DEFAULT 0)');
      });
  }
  static Future<List<Map<String, dynamic>>> list() async {
    final rows = await db.query('words', orderBy: 'id DESC');
    return rows.map((r) => <String, dynamic>{
      ...jsonDecode(r['data'] as String) as Map<String, dynamic>,
      'id': r['id'], 'bookmarked': r['bookmarked'] == 1,
    }).toList();
  }
  static Future<void> save(Map<String, dynamic> row) async {
    final data = {for (final key in keys) key: (row[key] ?? '').toString()};
    if (row['id'] == null) {
      await db.insert('words', {'data': jsonEncode(data), 'bookmarked': 0});
    } else {
      await db.update('words', {
        'data': jsonEncode(data), 'bookmarked': row['bookmarked'] == true ? 1 : 0
      }, where: 'id = ?', whereArgs: [row['id']]);
    }
  }
  static Future<void> delete(int id) =>
    db.delete('words', where: 'id = ?', whereArgs: [id]).then((_) {});
}

class Backend {
  static Future<Map<String, dynamic>> post(String action, Object body) async {
    if (apiBase.isEmpty || apiKey.isEmpty) {
      throw StateError('서버 연결 정보(WC_API_URL/WC_ANON_KEY)가 없습니다.');
    }
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 12);
    try {
      final base = apiBase.replaceFirst(RegExp(r'/$'), '');
      final request = await client.postUrl(Uri.parse(base + '/' + action));
      request.headers.contentType = ContentType.json;
      request.headers.set('apikey', apiKey);
      request.headers.set('Authorization', 'Bearer ' + apiKey);
      request.write(jsonEncode(body));
      final response = await request.close().timeout(const Duration(seconds: 60));
      final raw = await utf8.decoder.bind(response).join();
      final parsed = jsonDecode(raw);
      if (parsed is! Map<String, dynamic>) throw const FormatException('응답 형식 오류');
      if (response.statusCode >= 300) {
        throw StateError((parsed['error'] ?? 'API 오류').toString());
      }
      return parsed;
    } finally { client.close(force: true); }
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Store.init();
  runApp(const MaterialApp(debugShowCheckedModeBanner: false,
    home: WordHome()));
}

class WordHome extends StatefulWidget {
  const WordHome({super.key});
  @override
  State<WordHome> createState() => _WordHomeState();
}
class _WordHomeState extends State<WordHome> {
  List<Map<String, dynamic>> words = [];
  final selected = <int>{};
  String search = '';
  bool busy = false;
  bool bookmarksOnly = false;
  @override
  void initState() { super.initState(); refresh(); }
  Future<void> refresh() async {
    final result = await Store.list();
    if (mounted) setState(() {
      words = result;
      selected.removeWhere((id) => !words.any((w) => w['id'] == id));
    });
  }
  void notice(String s) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s)));
  }
  Future<void> edit([Map<String, dynamic>? old]) async {
    final ok = await Navigator.push<bool>(context,
      MaterialPageRoute(builder: (_) => EditWord(old: old)));
    if (ok == true) await refresh();
  }
  Future<void> toggle(Map<String, dynamic> row) async {
    await Store.save({...row, 'bookmarked': row['bookmarked'] != true});
    await refresh();
  }
  Future<void> export() async {
    final rows = words.where((w) => selected.contains(w['id'])).toList();
    if (rows.isEmpty) { notice('출력할 단어를 먼저 선택하세요.'); return; }
    setState(() => busy = true);
    try {
      final result = await Backend.post('export-sheets', {
        'records': rows.map((r) => {for (final k in keys) k: r[k]}).toList()
      });
      final url = Uri.tryParse((result['spreadsheetUrl'] ?? '').toString());
      if (url == null || url.scheme != 'https' || url.host != 'docs.google.com') {
        throw const FormatException('스프레드시트 링크가 없습니다.');
      }
      if (!mounted) return;
      await showDialog<void>(context: context, builder: (ctx) => AlertDialog(
        title: const Text('스프레드시트 생성 완료'),
        content: SelectableText(url.toString()),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('닫기'))],
      ));
    } catch (e) { notice('출력 실패: ' + e.toString()); }
    finally { if (mounted) setState(() => busy = false); }
  }
  @override
  Widget build(BuildContext context) {
    final visible = words.where((w) =>
      (!bookmarksOnly || w['bookmarked'] == true) &&
      (search.isEmpty || keys.any((k) =>
        (w[k] ?? '').toString().toLowerCase().contains(search.toLowerCase())))).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Word Collector'), actions: [
        IconButton(tooltip: '북마크만 보기',
          icon: Icon(bookmarksOnly ? Icons.bookmark : Icons.bookmark_border),
          onPressed: () => setState(() => bookmarksOnly = !bookmarksOnly)),
      ]),
      body: Column(children: [
        Padding(padding: const EdgeInsets.all(12), child: TextField(
          onChanged: (s) => setState(() => search = s),
          decoration: const InputDecoration(labelText: '단어·전공·과목 검색',
            border: OutlineInputBorder(), prefixIcon: Icon(Icons.search)),
        )),
        Text('전체 ' + words.length.toString() + '개 / 선택 ' + selected.length.toString() + '개'),
        Expanded(child: visible.isEmpty
          ? const Center(child: Text('단어가 없습니다. + 버튼으로 추가하세요.'))
          : ListView.builder(itemCount: visible.length, itemBuilder: (ctx, i) {
              final w = visible[i], id = w['id'] as int;
              return Card(child: ListTile(
                leading: Checkbox(value: selected.contains(id), onChanged: (v) =>
                  setState(() { if (v == true) { selected.add(id); } else { selected.remove(id); } })),
                title: Text((w['englishTerm'] ?? '').toString()),
                subtitle: Text((w['koreanMeaning'] ?? '').toString() + '\n' +
                  (w['specialization'] ?? '').toString() + ' · ' +
                  (w['notebookName'] ?? '').toString()),
                onTap: () => edit(w),
                trailing: PopupMenuButton<String>(
                  onSelected: (value) async {
                    if (value == 'bookmark') await toggle(w);
                    if (value == 'edit') await edit(w);
                    if (value == 'delete') {
                      await Store.delete(id); await refresh();
                    }
                  },
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: 'edit', child: Text('보기·수정')),
                    PopupMenuItem(value: 'bookmark', child: Text(w['bookmarked'] == true ? '북마크 해제' : '북마크')),
                    const PopupMenuItem(value: 'delete', child: Text('삭제')),
                  ]),
              ));
            })),
      ]),
      floatingActionButton: FloatingActionButton(onPressed: () => edit(),
        child: const Icon(Icons.add)),
      bottomNavigationBar: SafeArea(minimum: const EdgeInsets.all(12),
        child: FilledButton.icon(onPressed: busy ? null : export,
          icon: const Icon(Icons.table_chart),
          label: Text(busy ? '생성 중' : '선택한 단어 Google 스프레드시트 출력'))),
    );
  }
}

class EditWord extends StatefulWidget {
  final Map<String, dynamic>? old;
  const EditWord({super.key, this.old});
  @override
  State<EditWord> createState() => _EditWordState();
}
class _EditWordState extends State<EditWord> {
  late final List<TextEditingController> ctrls;
  bool busy = false;
  @override
  void initState() {
    super.initState();
    ctrls = keys.map((k) => TextEditingController(
      text: (widget.old?[k] ?? '').toString())).toList();
  }
  @override
  void dispose() { for (final c in ctrls) { c.dispose(); } super.dispose(); }
  Map<String, dynamic> value() => {
    ...?widget.old, for (var i = 0; i < keys.length; i++) keys[i]: ctrls[i].text.trim()
  };
  void msg(String s) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s)));
  Future<void> analyze() async {
    if (ctrls[0].text.trim().isEmpty) { msg('영어 용어를 입력하세요.'); return; }
    setState(() => busy = true);
    try {
      final result = await Backend.post('analyze-term', {
        'englishTerm': ctrls[0].text.trim(),
        'specialization': ctrls[2].text.trim(),
        'notebookName': ctrls[3].text.trim(),
      });
      final data = result['record'] is Map<String, dynamic>
          ? result['record'] as Map<String, dynamic> : result;
      for (var i = 0; i < keys.length; i++) {
        if ((data[keys[i]] ?? '').toString().trim().isNotEmpty) {
          ctrls[i].text = data[keys[i]].toString();
        }
      }
      msg('분석 완료. 수정 후 저장하세요.');
    } catch (e) { msg('분석 실패: ' + e.toString()); }
    finally { if (mounted) setState(() => busy = false); }
  }
  Future<void> save() async {
    final row = value();
    if ((row['englishTerm'] as String).isEmpty ||
        (row['notebookName'] as String).isEmpty) {
      msg('영어 용어와 과목명을 입력하세요.'); return;
    }
    try { await Store.save(row); if (mounted) Navigator.pop(context, true); }
    catch (e) { msg('저장 실패: ' + e.toString()); }
  }
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(widget.old == null ? '단어 입력·분석' : '단어 수정')),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      const Text('AI 분석 내용은 저장 전에 직접 검토할 수 있습니다.'),
      const SizedBox(height: 16),
      for (var i = 0; i < keys.length; i++) ...[
        TextField(controller: ctrls[i], enabled: !busy,
          minLines: i >= 4 ? 2 : 1, maxLines: i >= 4 ? 4 : 1,
          decoration: InputDecoration(labelText: fields[i],
            border: const OutlineInputBorder())),
        const SizedBox(height: 12),
      ],
      OutlinedButton.icon(onPressed: busy ? null : analyze,
        icon: const Icon(Icons.auto_awesome), label: const Text('AI로 7개 항목 분석')),
      FilledButton.icon(onPressed: busy ? null : save,
        icon: const Icon(Icons.save), label: const Text('검토 후 단어장에 저장')),
    ]),
  );
}
