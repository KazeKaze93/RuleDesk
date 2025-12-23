import ast
import os
import sys
import json
from pathlib import Path

def get_imports(file_path):
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=file_path)
        
        base_dir = os.path.dirname(file_path)
        
        for node in ast.walk(tree):
            # import x
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            # from x import y
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)
                elif node.level > 0:
                    # Relative imports (from . import x)
                    imports.append('.' * node.level)
    except Exception:
        pass # Ignore syntax errors in work-in-progress files
    return imports

def scan_project(root_dir):
    graph = {}
    root_path = Path(root_dir).resolve()

    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.py') and '.venv' not in root:
                full_path = Path(os.path.join(root, file))
                rel_path = str(full_path.relative_to(root_path)).replace('\\', '/')
                
                # Анализируем импорты
                raw_imports = get_imports(str(full_path))
                
                # Простая эвристика резолвинга (можно улучшить)
                resolved_deps = []
                for imp in raw_imports:
                    # Если импорт похож на локальный файл
                    possible_path = imp.replace('.', '/') + '.py'
                    if (root_path / possible_path).exists():
                         resolved_deps.append(possible_path)
                    
                    # Проверка внутри текущей директории
                    elif (full_path.parent / possible_path).exists():
                         # resolve relative to root
                         dep_abs = (full_path.parent / possible_path).resolve()
                         try:
                             dep_rel = str(dep_abs.relative_to(root_path)).replace('\\', '/')
                             resolved_deps.append(dep_rel)
                         except ValueError:
                             pass

                graph[rel_path] = resolved_deps

    print(json.dumps(graph))

if __name__ == '__main__':
    scan_project(sys.argv[1])