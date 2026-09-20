import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT/'scripts'/f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
check = load('check_page_prd_sync')
init = load('init_prototype')

class ToolsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root/'proto-spec').mkdir()
    def tearDown(self):
        self.tmp.cleanup()
    def page(self, pid='asset-list', html=False):
        (self.root/'proto-spec'/f'{pid}.md').write_text(f'---\nid: {pid}\nname: 资产\n---\n## 来源\n测试输入')
        if html:
            (self.root/'pages').mkdir(exist_ok=True)
            (self.root/'pages'/f'{pid}.html').write_text('<h1>资产</h1>')
    def sitemap(self, body):
        (self.root/'sitemap.yaml').write_text(body)
    def test_stages_and_exit(self):
        self.sitemap('groups: []\npages:\n  - id: asset-list\n    name: 资产\n')
        self.page()
        self.assertFalse(check.check(self.root,'spec')[0])
        self.assertTrue(check.check(self.root)[0])
        run = subprocess.run([sys.executable,str(ROOT/'scripts/check_page_prd_sync.py'),str(self.root)],capture_output=True)
        self.assertEqual(run.returncode,1)
    def test_batch_scope(self):
        self.sitemap('pages:\n  - id: asset-list\n  - id: asset-detail\n')
        self.page(html=True)
        self.assertFalse(check.check(self.root,'prototype',['asset-list'])[0])
        self.assertTrue(check.check(self.root,'prototype',['unknown'])[0])
    def test_nested_properties_and_legacy(self):
        pages,groups,refs=check.parse_sitemap('groups:\n  - id: assets\npages:\n  - id: asset-list\n    groupId: assets\n    children:\n      - id: asset-detail\n        path: pages/detail.html\n    path: pages/list.html\n')
        self.assertEqual(pages[0]['path'],'pages/list.html')
        self.assertEqual(pages[1]['path'],'pages/detail.html')
        self.assertEqual(pages[1]['groupId'],'assets')
        self.sitemap('pages:\n  - id: asset-list\n')
        folder=self.root/'proto-spec/asset-list';folder.mkdir()
        (folder/'meta.yaml').write_text('page:\n  id: asset-list\n  name: 资产\n')
        (folder/'business.md').write_text('历史业务')
        self.assertFalse(check.check(self.root,'spec')[0])
    def test_invalid_sitemap(self):
        for body in ['pages: [{id: x}]','groups: []','pages:\n  - id: x\n    children: {x: y}']:
            self.sitemap(body)
            self.assertTrue(check.check(self.root,'spec')[0])
    def test_identity_path_and_duplicates(self):
        self.page(html=True)
        for body in ['pages:\n  - id: asset-list\n    path: elsewhere/asset-list.html\n','pages:\n  - id: asset-list\n  - id: asset-list\n','pages:\n  - id: asset-list\n    path: ../escape.html\n']:
            self.sitemap(body)
            self.assertTrue(check.check(self.root)[0])
        self.sitemap('pages:\n  - id: asset-list\n')
        (self.root/'proto-spec/asset-list.md').write_text('---\nid: wrong\nname: 资产\n---\n')
        self.assertTrue(check.check(self.root,'spec')[0])
    def test_planned_and_orphans(self):
        self.sitemap('pages:\n  - id: later-list\n    status: planned\n')
        self.assertFalse(check.check(self.root)[0])
        self.page()
        self.assertTrue(check.check(self.root,'spec')[0])
    def test_init_preserves_and_fills(self):
        self.sitemap('pages: []\n# 用户已有内容\n')
        self.page()
        (self.root/'index.html').write_text('custom entry')
        init.copy_kits(self.root);init.scaffold(self.root,'demo')
        kit=self.root/'kits/ob-static/tokens.css';kit.write_text('custom tokens')
        missing=self.root/'kits/proto-spec-runtime/proto-spec.js';missing.unlink()
        snapshot={p:p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        init.copy_kits(self.root);init.scaffold(self.root,'different')
        self.assertTrue(missing.is_file())
        for p,data in snapshot.items(): self.assertEqual(p.read_bytes(),data,str(p))
        self.assertFalse((self.root/'docs/req-breakdown.md').exists())
        self.assertFalse((self.root/'docs/menu-plan.md').exists())
    def test_fix_flag_never_mutates(self):
        self.sitemap('pages:\n  - id: missing-list\n')
        before=(self.root/'sitemap.yaml').read_bytes()
        run=subprocess.run([sys.executable,str(ROOT/'scripts/check_page_prd_sync.py'),str(self.root),'--fix'],capture_output=True)
        self.assertEqual(run.returncode,1)
        self.assertEqual((self.root/'sitemap.yaml').read_bytes(),before)
    def test_new_package_empty(self):
        init.scaffold(self.root,'<unsafe>')
        pages,_,_=check.parse_sitemap((self.root/'sitemap.yaml').read_text())
        self.assertEqual(pages,[])
        self.assertIn('&lt;unsafe&gt;', (self.root/'index.html').read_text())

if __name__=='__main__': unittest.main()
