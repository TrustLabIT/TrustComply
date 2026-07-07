// Reads a FileList into serialisable document objects (data URIs) so uploaded
// files can live in the in-memory store and export/import cleanly.

export const MAX_DOC_MB = 8;

export function readFiles(fileList, onSkip) {
  const files = [...fileList];
  return Promise.all(
    files.map(
      (f) =>
        new Promise((res) => {
          if (f.size > MAX_DOC_MB * 1048576) {
            if (onSkip) onSkip(f.name);
            return res(null);
          }
          const rd = new FileReader();
          rd.onload = () =>
            res({
              name: f.name,
              size: f.size,
              type: f.type || "application/octet-stream",
              added: new Date().toISOString().slice(0, 10),
              data: rd.result,
            });
          rd.onerror = () => res(null);
          rd.readAsDataURL(f);
        })
    )
  ).then((a) => a.filter(Boolean));
}
