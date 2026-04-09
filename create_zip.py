import os
import zipfile

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        # exclude venv, .git, __pycache__, etc
        if 'venv' in root or '.git' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith('.zip'): 
                continue
            ziph.write(os.path.join(root, file), 
                       os.path.relpath(os.path.join(root, file), 
                                       os.path.join(path, '..')))

if __name__ == '__main__':
    project_dir = os.path.dirname(os.path.abspath(__file__))
    zip_name = 'StayNest_Complete.zip'
    print(f"Creating {zip_name} ...")
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipdir(project_dir, zipf)
    print(f"Done! Created {zip_name} in {project_dir}")
