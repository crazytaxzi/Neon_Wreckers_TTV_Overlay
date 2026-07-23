from pathlib import Path

readme = Path('README.md')
text = readme.read_text()
old = '''No open-source license is currently present. Third-party reuse must be treated as unauthorized unless the project owner publishes explicit terms. The owner must deliberately choose either an open-source license or a proprietary distribution notice before broader reuse rights are granted. See [LICENSE_STATUS.md](LICENSE_STATUS.md).'''
new = '''Neon Wreckers is proprietary software and all rights are reserved. Public visibility does not grant permission to copy, modify, redistribute, sublicense, host, deploy, sell, or create derivative works from the source code, artwork, game content, branding, documentation, configuration, or deployment materials. See [LICENSE](LICENSE) for the controlling notice. Third-party dependencies remain governed by their own licenses.'''
if old not in text:
    raise SystemExit('README licensing placeholder did not match expected text')
readme.write_text(text.replace(old, new, 1))

Path('LICENSE').write_text('''Neon Wreckers Proprietary License Notice

Copyright (c) 2026 the Neon Wreckers project owner. All rights reserved.

This software and repository, including its source code, artwork, game content, branding, documentation, configuration, and deployment materials, are proprietary.

No permission is granted to copy, modify, redistribute, sublicense, sell, host, deploy, publish, or create derivative works from any part of this project without prior written permission from the project owner.

Public access to this repository is provided for review and authorized collaboration only and does not grant any license or other reuse rights.

Third-party software and assets remain subject to their respective license terms.
''')

status = Path('LICENSE_STATUS.md')
if status.exists():
    status.unlink()

test_file = Path('tools/test/docs-consistency.test.mjs')
tests = test_file.read_text()
tests = tests.replace("const status = read('LICENSE_STATUS.md');", "const license = read('LICENSE');")
tests = tests.replace("assert.match(status, /does not currently contain an open-source license/i);", "assert.match(license, /proprietary/i);")
tests = tests.replace("assert.match(status, /not itself a license/i);", "assert.match(license, /All rights reserved/);")
tests = tests.replace("public visibility and license status are described without inventing reuse rights", "public visibility and proprietary license are consistent")
test_file.write_text(tests)
