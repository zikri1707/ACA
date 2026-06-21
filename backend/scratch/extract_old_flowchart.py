import subprocess

commit = "51868f5"
filepath = "frontend/src/pages/RuleBaseIndex.jsx"

result = subprocess.run(["git", "show", f"{commit}:{filepath}"], capture_output=True, text=True, encoding="utf-8")
content = result.stdout
lines = content.stdout.splitlines() if hasattr(content, "stdout") else content.splitlines()

output_lines = []
for idx in range(1955, 2060):
    if idx < len(lines):
        output_lines.append(f"{idx+1}: {lines[idx]}")

with open("scratch/flowchart_tab_end.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))

print("Successfully written flowchart tab end to scratch/flowchart_tab_end.txt")
