/**
 * Mas Andy PDF Tools - Refactored script.js
 * Professional PDF Management Suite
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. LIBRARIES & CONSTANTS
  const {
    PDFDocument,
    PageSizes,
    StandardFonts,
    rgb,
    degrees,
    PDFName,
    PDFStream,
  } = PDFLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

  // 2. GLOBAL STATE
  const state = {
    mergeFiles: [],
    splitFile: null,
    compressFile: null,
    toImageFile: null,
    imageFiles: [],
    rotateFile: null,
    organizeFile: null,
    pageRotations: [],
    watermarkFile: null,
    numberingFile: null,
    protectFile: null,
    esignPdfFile: null,
    signatureImageFile: null,
    esignClickCoords: null,
    unlockFile: null,
    grayscaleFile: null,
    extractTextFile: null,
    metadataFile: null,
    pdfToWordFile: null,
    scannedImages: [],
    scanStream: null,
  };

  // 3. CORE UTILITIES
  const Utils = {
    showLoader(text = "Memproses... Mohon tunggu...") {
      const loader = document.getElementById("loader");
      loader.querySelector("p").textContent = text;
      loader.classList.remove("hidden");
    },
    hideLoader() {
      document.getElementById("loader").classList.add("hidden");
    },
    downloadFile(data, filename, type) {
      const blob = data instanceof Blob ? data : new Blob([data], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    async renderPdfPages(file, gridElement, checkboxClass) {
      this.showLoader("Memuat pratinjau halaman...");
      gridElement.innerHTML = "";
      try {
        const pdf = await pdfjsLib.getDocument({
          data: await file.arrayBuffer(),
        }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport }).promise;

          const thumb = document.createElement("div");
          thumb.className = "page-thumbnail";
          thumb.innerHTML = `<label><input type="checkbox" class="${checkboxClass}" value="${i}"> Halaman ${i}</label>`;
          thumb.prepend(canvas);
          gridElement.appendChild(thumb);
        }
      } catch (error) {
        console.error(error);
        alert("Gagal memuat file PDF.");
      } finally {
        this.hideLoader();
      }
    },
  };

  // 4. UI COMPONENTS HANDLERS
  const UI = {
    init() {
      this.initTheme();
      this.initTabs();
      this.initModals();
      this.initSearch();
      this.initFooter();
    },
    initTheme() {
      const toggle = document.getElementById("theme-toggle");
      const set = (t) => {
        document.body.classList.toggle("dark-theme", t === "dark");
        toggle.querySelector("i").className =
          t === "dark" ? "fas fa-sun" : "fas fa-moon";
        localStorage.setItem("theme", t);
      };
      if (localStorage.getItem("theme") === "dark") set("dark");
      toggle.addEventListener("click", () =>
        set(document.body.classList.contains("dark-theme") ? "light" : "dark"),
      );
    },
    initTabs() {
      const tabs = document.querySelectorAll(".tab-btn");
      const contents = document.querySelectorAll(".tool-content");
      tabs.forEach((t) =>
        t.addEventListener("click", () => {
          const id = t.dataset.tab;
          tabs.forEach((item) => item.classList.remove("active"));
          contents.forEach((c) => c.classList.remove("active"));
          t.classList.add("active");
          document.getElementById(id).classList.add("active");
          localStorage.setItem("activeTab", id);
        }),
      );
      const active = localStorage.getItem("activeTab");
      if (active) {
        const target = document.querySelector(`[data-tab="${active}"]`);
        if (target) target.click();
      }
    },
    initModals() {
      const openBtns = document.querySelectorAll("[data-modal-target]");
      const closeBtns = document.querySelectorAll(".modal-close");
      const overlays = document.querySelectorAll(".modal-overlay");
      openBtns.forEach((b) =>
        b.addEventListener("click", (e) => {
          e.preventDefault();
          document
            .querySelector(b.dataset.modalTarget)
            ?.classList.add("active");
        }),
      );
      closeBtns.forEach((b) =>
        b.addEventListener("click", () =>
          b.closest(".modal-overlay").classList.remove("active"),
        ),
      );
      overlays.forEach((o) =>
        o.addEventListener(
          "click",
          (e) => e.target === o && o.classList.remove("active"),
        ),
      );
    },
    initSearch() {
      const searchInput = document.getElementById("tool-search");
      const grid = document.getElementById("main-tool-grid");
      if (!searchInput || !grid) return;
      searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        grid.querySelectorAll(".tool-card").forEach((card) => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(term) ? "flex" : "none";
        });
      });
    },
    initFooter() {
      const span = document.getElementById("current-year");
      if (span) span.textContent = new Date().getFullYear();
    },
  };

  // 5. TOOL MODULES
  const Tools = {
    Merge: {
      init() {
        const input = document.getElementById("merge-file-input");
        input.addEventListener("change", (e) => {
          Array.from(e.target.files).forEach(
            (f) => f.type === "application/pdf" && state.mergeFiles.push(f),
          );
          input.value = "";
          this.render();
        });
        new Sortable(document.getElementById("merge-file-list"), {
          animation: 150,
          onEnd: (evt) => {
            const [moved] = state.mergeFiles.splice(evt.oldIndex, 1);
            state.mergeFiles.splice(evt.newIndex, 0, moved);
            this.render();
          },
        });
        document
          .getElementById("merge-btn")
          .addEventListener("click", () => this.process());
      },
      render() {
        const list = document.getElementById("merge-file-list");
        list.innerHTML = "";
        state.mergeFiles.forEach((f, i) => {
          const li = document.createElement("li");
          li.className = "merge-file-item";
          li.innerHTML = `<span>${f.name}</span><button class="remove-btn" data-index="${i}">&times;</button>`;
          list.appendChild(li);
        });
        list.querySelectorAll(".remove-btn").forEach(
          (b) =>
            (b.onclick = () => {
              state.mergeFiles.splice(parseInt(b.dataset.index), 1);
              this.render();
            }),
        );
        document.getElementById("merge-btn").disabled =
          state.mergeFiles.length < 2;
      },
      async process() {
        Utils.showLoader("Menggabungkan file PDF...");
        try {
          const merged = await PDFDocument.create();
          for (const f of state.mergeFiles) {
            const pdf = await PDFDocument.load(await f.arrayBuffer());
            const pages = await merged.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((p) => merged.addPage(p));
          }
          Utils.downloadFile(
            await merged.save(),
            "gabungan.pdf",
            "application/pdf",
          );
          window.showChainedTask();
        } catch (e) {
          alert("Gagal menggabungkan PDF.");
        } finally {
          Utils.hideLoader();
        }
      },
    },

    Split: {
      init() {
        const input = document.getElementById("split-file-input");
        const grid = document.getElementById("split-page-grid");
        input.addEventListener("change", (e) => {
          const f = e.target.files[0];
          if (f?.type === "application/pdf") {
            state.splitFile = f;
            Utils.renderPdfPages(f, grid, "page-checkbox");
            document.getElementById("split-download-all-zip-btn").disabled =
              false;
          }
        });
        grid.addEventListener("change", () => {
          document.getElementById("split-download-selected-btn").disabled =
            !grid.querySelector(".page-checkbox:checked");
        });
        document.getElementById("split-select-all-btn").onclick = () => {
          grid
            .querySelectorAll(".page-checkbox")
            .forEach((c) => (c.checked = true));
          document.getElementById("split-download-selected-btn").disabled =
            false;
        };
        document.getElementById("split-deselect-all-btn").onclick = () => {
          grid
            .querySelectorAll(".page-checkbox")
            .forEach((c) => (c.checked = false));
          document.getElementById("split-download-selected-btn").disabled =
            true;
        };
        document.getElementById("split-download-selected-btn").onclick = () =>
          this.downloadSelected();
        document.getElementById("split-download-all-zip-btn").onclick = () =>
          this.downloadAllZip();
      },
      async downloadSelected() {
        const pages = Array.from(
          document.querySelectorAll(".page-checkbox:checked"),
        ).map((c) => parseInt(c.value) - 1);
        if (!pages.length || !state.splitFile) return;
        Utils.showLoader("Memproses...");
        try {
          const src = await PDFDocument.load(
            await state.splitFile.arrayBuffer(),
          );
          const out = await PDFDocument.create();
          const copied = await out.copyPages(src, pages);
          copied.forEach((p) => out.addPage(p));
          Utils.downloadFile(
            await out.save(),
            "halaman_terpilih.pdf",
            "application/pdf",
          );
        } finally {
          Utils.hideLoader();
        }
      },
      async downloadAllZip() {
        if (!state.splitFile) return;
        Utils.showLoader("Menyiapkan ZIP...");
        const zip = new JSZip();
        try {
          const src = await PDFDocument.load(
            await state.splitFile.arrayBuffer(),
          );
          for (let i = 0; i < src.getPageCount(); i++) {
            Utils.showLoader(`Memproses hal ${i + 1}/${src.getPageCount()}...`);
            const out = await PDFDocument.create();
            const [p] = await out.copyPages(src, [i]);
            out.addPage(p);
            zip.file(`halaman_${i + 1}.pdf`, await out.save());
          }
          Utils.downloadFile(
            await zip.generateAsync({ type: "blob" }),
            "semua_halaman.zip",
            "application/zip",
          );
        } finally {
          Utils.hideLoader();
        }
      },
    },

    Compress: {
      init() {
        const input = document.getElementById("compress-file-input");
        input.addEventListener("change", (e) => {
          const f = e.target.files[0];
          if (f?.type === "application/pdf") {
            state.compressFile = f;
            document.getElementById("compress-file-info").textContent =
              `Dipilih: ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`;
            document.getElementById("compress-btn").disabled = false;
          }
        });
        document.getElementById("compress-btn").onclick = () => this.process();
      },
      async process() {
        if (!state.compressFile) return;
        Utils.showLoader("Mengecilkan PDF...");
        try {
          const level = document.getElementById("compress-level-select").value;
          let dpi = 96,
            quality = 0.6;
          if (level === "extreme") {
            dpi = 40;
            quality = 0.2;
          } else if (level === "high") {
            dpi = 72;
            quality = 0.4;
          } else if (level === "low") {
            dpi = 150;
            quality = 0.9;
          }

          const pdfjs = await pdfjsLib.getDocument({
            data: new Uint8Array(await state.compressFile.arrayBuffer()),
          }).promise;
          const out = await PDFDocument.create();

          for (let i = 1; i <= pdfjs.numPages; i++) {
            Utils.showLoader(`Halaman ${i}/${pdfjs.numPages}...`);
            const page = await pdfjs.getPage(i);
            const v = page.getViewport({ scale: dpi / 72 });
            const canvas = document.createElement("canvas");
            canvas.width = v.width;
            canvas.height = v.height;
            await page.render({
              canvasContext: canvas.getContext("2d"),
              viewport: v,
            }).promise;

            const imgBytes = await fetch(
              canvas.toDataURL("image/jpeg", quality),
            ).then((r) => r.arrayBuffer());
            const img = await out.embedJpg(imgBytes);
            const p = out.addPage([v.width, v.height]);
            p.drawImage(img, { x: 0, y: 0, width: v.width, height: v.height });
          }
          const bytes = await out.save();
          if (bytes.byteLength >= state.compressFile.size) {
            alert("Ukuran tidak bisa lebih kecil lagi.");
          } else {
            Utils.downloadFile(
              bytes,
              `kecil_${state.compressFile.name}`,
              "application/pdf",
            );
            alert(
              `Selesai! Pengurangan: ${(((state.compressFile.size - bytes.byteLength) / state.compressFile.size) * 100).toFixed(1)}%`,
            );
          }
        } finally {
          Utils.hideLoader();
        }
      },
    },

    ToImage: {
      init() {
        const input = document.getElementById("to-image-file-input");
        input.addEventListener("change", (e) => {
          const f = e.target.files[0];
          if (f?.type === "application/pdf") {
            state.toImageFile = f;
            Utils.renderPdfPages(
              f,
              document.getElementById("to-image-page-grid"),
              "to-image-page-checkbox",
            );
            document.getElementById(
              "to-image-preview-container",
            ).style.display = "block";
          }
        });
        document
          .getElementById("to-image-page-grid")
          .addEventListener("change", () => {
            document.getElementById("to-image-download-btn").disabled =
              !document.querySelector(".to-image-page-checkbox:checked");
          });
        document.getElementById("to-image-format-select").onchange = (e) => {
          document.getElementById("to-image-quality-control").style.display =
            e.target.value === "image/jpeg" ? "flex" : "none";
        };
        document.getElementById("to-image-quality-slider").oninput = (e) => {
          document.getElementById("to-image-quality-value").textContent =
            e.target.value;
        };
        document.getElementById("to-image-select-all-btn").onclick = () => {
          document
            .querySelectorAll(".to-image-page-checkbox")
            .forEach((c) => (c.checked = true));
          document.getElementById("to-image-download-btn").disabled = false;
        };
        document
          .getElementById("to-image-deselect-all-btn")
          ?.addEventListener("click", () => {
            document
              .querySelectorAll(".to-image-page-checkbox")
              .forEach((c) => (c.checked = false));
            document.getElementById("to-image-download-btn").disabled = true;
          });
        document.getElementById("to-image-download-btn").onclick = () =>
          this.process();
      },
      async process() {
        const pages = Array.from(
          document.querySelectorAll(".to-image-page-checkbox:checked"),
        ).map((c) => parseInt(c.value));
        if (!pages.length || !state.toImageFile) return;
        Utils.showLoader("Konversi ke gambar...");
        const zip = new JSZip();
        try {
          const pdf = await pdfjsLib.getDocument({
            data: await state.toImageFile.arrayBuffer(),
          }).promise;
          const fmt = document.getElementById("to-image-format-select").value;
          const qual =
            parseInt(document.getElementById("to-image-quality-slider").value) /
            100;
          const ext = fmt === "image/jpeg" ? "jpg" : "png";

          for (const num of pages) {
            Utils.showLoader(`Diprotes hal ${num}...`);
            const page = await pdf.getPage(num);
            const v = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement("canvas");
            canvas.width = v.width;
            canvas.height = v.height;
            await page.render({
              canvasContext: canvas.getContext("2d"),
              viewport: v,
            }).promise;
            const blob = await (
              await fetch(canvas.toDataURL(fmt, qual))
            ).blob();
            zip.file(`halaman_${num}.${ext}`, blob);
          }
          Utils.downloadFile(
            await zip.generateAsync({ type: "blob" }),
            `${state.toImageFile.name.replace(".pdf", "")}_images.zip`,
            "application/zip",
          );
        } finally {
          Utils.hideLoader();
        }
      },
    },

    ImageToPdf: {
      init() {
        const input = document.getElementById("image-to-pdf-input");
        input.addEventListener("change", (e) => {
          Array.from(e.target.files).forEach(
            (f) =>
              (f.type === "image/jpeg" || f.type === "image/png") &&
              state.imageFiles.push(f),
          );
          input.value = "";
          this.render();
        });
        new Sortable(document.getElementById("image-list"), {
          animation: 150,
          onEnd: (evt) => {
            const [moved] = state.imageFiles.splice(evt.oldIndex, 1);
            state.imageFiles.splice(evt.newIndex, 0, moved);
            this.render();
          },
        });
        document.getElementById("convert-to-pdf-btn").onclick = () =>
          this.process();
      },
      render() {
        const list = document.getElementById("image-list");
        list.innerHTML = "";
        state.imageFiles.forEach((f, i) => {
          const li = document.createElement("li");
          li.className = "image-list-item";
          li.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="preview"><span>${f.name}</span><button class="remove-btn" data-index="${i}">&times;</button>`;
          list.appendChild(li);
        });
        list.querySelectorAll(".remove-btn").forEach(
          (b) =>
            (b.onclick = () => {
              state.imageFiles.splice(parseInt(b.dataset.index), 1);
              this.render();
            }),
        );
        document.getElementById("convert-to-pdf-btn").disabled =
          !state.imageFiles.length;
      },
      async process() {
        if (!state.imageFiles.length) return;
        Utils.showLoader("Membuat PDF...");
        try {
          const out = await PDFDocument.create();
          const margin = Number(
            document.getElementById("page-margin-select")?.value || 0,
          );
          let size =
            PageSizes[document.getElementById("page-size-select").value];
          if (
            document.getElementById("page-orientation-select").value ===
            "landscape"
          )
            size = [size[1], size[0]];

          for (const f of state.imageFiles) {
            const img =
              f.type === "image/jpeg"
                ? await out.embedJpg(await f.arrayBuffer())
                : await out.embedPng(await f.arrayBuffer());
            const p = out.addPage(size);
            const dw = p.getWidth() - 2 * margin,
              dh = p.getHeight() - 2 * margin;
            const dims = img.scaleToFit(dw, dh);
            p.drawImage(img, {
              x: margin + (dw - dims.width) / 2,
              y: margin + (dh - dims.height) / 2,
              width: dims.width,
              height: dims.height,
            });
          }
          Utils.downloadFile(
            await out.save(),
            "gambar_konversi.pdf",
            "application/pdf",
          );
        } finally {
          Utils.hideLoader();
        }
      },
    },

    Rotate: {
      init() {
        const input = document.getElementById("rotate-file-input");
        input.onchange = async (e) => {
          if (e.target.files[0]) {
            state.rotateFile = e.target.files[0];
            await this.render();
          }
        };
        document.getElementById("rotate-process-btn").onclick = () =>
          this.process();
      },
      async render() {
        const grid = document.getElementById("rotate-page-grid");
        grid.innerHTML = "";
        state.pageRotations = [];
        Utils.showLoader("Memuat...");
        const pdf = await pdfjsLib.getDocument({
          data: await state.rotateFile.arrayBuffer(),
        }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          state.pageRotations.push(0);
          const page = await pdf.getPage(i);
          const v = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          canvas.width = v.width;
          canvas.height = v.height;
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport: v,
          }).promise;

          const thumb = document.createElement("div");
          thumb.className = "rotate-thumbnail";
          thumb.dataset.pageNum = i;
          thumb.innerHTML = `<p>Hal ${i}</p><div class="rotate-controls"><button class="rotate-btn"><i class="fas fa-redo"></i></button></div>`;
          thumb.prepend(canvas);
          grid.appendChild(thumb);
        }
        grid.querySelectorAll(".rotate-btn").forEach(
          (b) =>
            (b.onclick = (e) => {
              const t = e.currentTarget.closest(".rotate-thumbnail");
              const idx = parseInt(t.dataset.pageNum) - 1;
              state.pageRotations[idx] = (state.pageRotations[idx] + 90) % 360;
              t.querySelector("canvas").style.transform =
                `rotate(${state.pageRotations[idx]}deg)`;
            }),
        );
        document.getElementById("rotate-process-btn").disabled = false;
        Utils.hideLoader();
      },
      async process() {
        Utils.showLoader("Memutar...");
        const doc = await PDFDocument.load(
          await state.rotateFile.arrayBuffer(),
        );
        doc.getPages().forEach((p, i) => {
          if (state.pageRotations[i])
            p.setRotation(
              degrees((p.getRotation().angle + state.pageRotations[i]) % 360),
            );
        });
        Utils.downloadFile(
          await doc.save(),
          `putar_${state.rotateFile.name}`,
          "application/pdf",
        );
        Utils.hideLoader();
      },
    },

    Organize: {
      init() {
        const input = document.getElementById("organize-file-input");
        input.onchange = async (e) => {
          if (e.target.files[0]) {
            state.organizeFile = e.target.files[0];
            await this.render();
          }
        };
        new Sortable(document.getElementById("organize-page-grid"), {
          animation: 150,
        });
        document.getElementById("organize-process-btn").onclick = () =>
          this.process();
      },
      async render() {
        const grid = document.getElementById("organize-page-grid");
        grid.innerHTML = "";
        Utils.showLoader("Memuat...");
        const pdf = await pdfjsLib.getDocument({
          data: await state.organizeFile.arrayBuffer(),
        }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const v = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          canvas.width = v.width;
          canvas.height = v.height;
          await page.render({
            canvasContext: canvas.getContext("2d"),
            viewport: v,
          }).promise;
          const thumb = document.createElement("div");
          thumb.className = "organize-thumbnail";
          thumb.dataset.originalIndex = i - 1;
          thumb.dataset.rotation = 0;
          thumb.innerHTML = `<div class="organize-controls"><button class="rotate-btn"><i class="fas fa-redo"></i></button><button class="delete-btn"><i class="fas fa-trash"></i></button></div><div class="organize-thumbnail-info">Hal ${i}</div>`;
          thumb.prepend(canvas);
          grid.appendChild(thumb);
        }
        grid.querySelectorAll(".rotate-btn").forEach(
          (b) =>
            (b.onclick = (e) => {
              const t = e.currentTarget.closest(".organize-thumbnail");
              let r = (parseInt(t.dataset.rotation) + 90) % 360;
              t.dataset.rotation = r;
              t.querySelector("canvas").style.transform = `rotate(${r}deg)`;
            }),
        );
        grid.querySelectorAll(".delete-btn").forEach(
          (b) =>
            (b.onclick = (e) => {
              e.currentTarget.closest(".organize-thumbnail").remove();
              document.getElementById("organize-process-btn").disabled =
                !grid.children.length;
            }),
        );
        document.getElementById("organize-process-btn").disabled = false;
        Utils.hideLoader();
      },
      async process() {
        Utils.showLoader("Menyusun...");
        const src = await PDFDocument.load(
          await state.organizeFile.arrayBuffer(),
        );
        const out = await PDFDocument.create();
        const thumbs = Array.from(
          document.getElementById("organize-page-grid").children,
        );
        const indices = thumbs.map((t) => parseInt(t.dataset.originalIndex));
        const copied = await out.copyPages(src, indices);
        thumbs.forEach((t, i) => {
          const p = out.addPage(copied[i]);
          const r = parseInt(t.dataset.rotation);
          if (r) p.setRotation(degrees((p.getRotation().angle + r) % 360));
        });
        Utils.downloadFile(
          await out.save(),
          `siap_${state.organizeFile.name}`,
          "application/pdf",
        );
        Utils.hideLoader();
      },
    },

    Watermark: {
      init() {
        document.getElementById("watermark-file-input").onchange = (e) => {
          if (e.target.files[0]) {
            state.watermarkFile = e.target.files[0];
            document.getElementById("watermark-process-btn").disabled = false;
          }
        };
        document.getElementById("watermark-opacity-slider").oninput = (e) =>
          (document.getElementById("watermark-opacity-value").textContent =
            e.target.value);
        document.querySelectorAll('input[name="watermark-type"]').forEach(
          (r) =>
            (r.onchange = (e) => {
              document.getElementById("watermark-text-options").style.display =
                e.target.value === "text" ? "block" : "none";
              document.getElementById("watermark-image-options").style.display =
                e.target.value === "image" ? "block" : "none";
            }),
        );
        document.getElementById("watermark-process-btn").onclick = () =>
          this.process();
      },
      async process() {
        if (!state.watermarkFile) return;
        const type = document.querySelector(
          'input[name="watermark-type"]:checked',
        ).value;
        Utils.showLoader("Memberi Watermark...");
        try {
          const doc = await PDFDocument.load(
            await state.watermarkFile.arrayBuffer(),
          );
          const opacity = Number(
            document.getElementById("watermark-opacity-slider").value,
          );
          const size = Number(
            document.getElementById("watermark-size-input").value,
          );
          const pos = document.getElementById(
            "watermark-position-select",
          ).value;

          if (type === "text") {
            const font = await doc.embedFont(StandardFonts.Helvetica);
            const text =
              document.getElementById("watermark-text-input").value || "DRAFT";
            doc.getPages().forEach((p) => {
              const { width, height } = p.getSize();
              const tw = font.widthOfTextAtSize(text, size);
              let x = (width - tw) / 2,
                y = (height - size) / 2,
                rotate = degrees(0);
              if (pos === "diagonal") {
                rotate = degrees((Math.atan2(height, width) * 180) / Math.PI);
                x = (width - tw * 0.7) / 2;
                y = (height - tw * 0.7) / 2;
              } else if (pos === "bottom-right") {
                x = width - tw - 20;
                y = 20;
              } else if (pos === "top-center") {
                x = (width - tw) / 2;
                y = height - size - 20;
              }
              p.drawText(text, { x, y, size, font, opacity, rotate });
            });
          } else {
            const imgFile = document.getElementById("watermark-image-input")
              .files[0];
            if (!imgFile) throw "No logo";
            const img =
              imgFile.type === "image/png"
                ? await doc.embedPng(await imgFile.arrayBuffer())
                : await doc.embedJpg(await imgFile.arrayBuffer());
            doc.getPages().forEach((p) => {
              const { width, height } = p.getSize();
              const iw = size * 2,
                ih = iw / (img.width / img.height);
              let x = (width - iw) / 2,
                y = (height - ih) / 2;
              if (pos === "bottom-right") {
                x = width - iw - 20;
                y = 20;
              } else if (pos === "top-center") {
                x = (width - iw) / 2;
                y = height - ih - 20;
              }
              p.drawImage(img, { x, y, width: iw, height: ih, opacity });
            });
          }
          Utils.downloadFile(
            await doc.save(),
            `watermark_${state.watermarkFile.name}`,
            "application/pdf",
          );
          window.showChainedTask();
        } catch (e) {
          alert("Gagal.");
        } finally {
          Utils.hideLoader();
        }
      },
    },

    Numbering: {
      init() {
        document.getElementById("numbering-file-input").onchange = (e) => {
          if (e.target.files[0]) {
            state.numberingFile = e.target.files[0];
            document.getElementById("numbering-process-btn").disabled = false;
          }
        };
        document.getElementById("numbering-process-btn").onclick = () =>
          this.process();
      },
      async process() {
        Utils.showLoader("Menomori...");
        const doc = await PDFDocument.load(
          await state.numberingFile.arrayBuffer(),
        );
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const fmt = document.getElementById("numbering-format-input").value;
        const total = doc.getPageCount();
        doc.getPages().forEach((p, i) => {
          const txt = fmt.replace("{page}", i + 1).replace("{total}", total);
          const size = 12,
            tw = font.widthOfTextAtSize(txt, size);
          const { width, height } = p.getSize();
          let x = (width - tw) / 2,
            y = 20;
          const pos = document.getElementById(
            "numbering-position-select",
          ).value;
          if (pos === "bottom-right") x = width - tw - 36;
          else if (pos === "top-center") y = height - 36;
          p.drawText(txt, { x, y, size, font });
        });
        Utils.downloadFile(
          await doc.save(),
          `hal_${state.numberingFile.name}`,
          "application/pdf",
        );
        Utils.hideLoader();
      },
    },

    Security: {
      init() {
        document.getElementById("protect-file-input").onchange = (e) => {
          if (e.target.files[0]) {
            state.protectFile = e.target.files[0];
            document.getElementById("protect-process-btn").disabled = false;
          }
        };
        document.getElementById("protect-process-btn").onclick = async () => {
          const p1 = document.getElementById("protect-password-input").value;
          const p2 = document.getElementById(
            "protect-confirm-password-input",
          ).value;
          if (p1.length < 4 || p1 !== p2) return alert("Password Salah.");
          Utils.showLoader("Enkripsi...");
          const doc = await PDFDocument.load(
            await state.protectFile.arrayBuffer(),
          );
          Utils.downloadFile(
            await doc.save({
              encrypt: { ownerPassword: p1, userPassword: p1 },
            }),
            `lock_${state.protectFile.name}`,
            "application/pdf",
          );
          Utils.hideLoader();
        };
        document.getElementById("unlock-file-input").onchange = (e) => {
          if (e.target.files[0]) {
            state.unlockFile = e.target.files[0];
            document.getElementById("unlock-process-btn").disabled = false;
          }
        };
        document.getElementById("unlock-process-btn").onclick = async () => {
          const pass = document.getElementById("unlock-password-input").value;
          Utils.showLoader("Dukunci...");
          try {
            const doc = await PDFDocument.load(
              await state.unlockFile.arrayBuffer(),
              { password: pass },
            );
            Utils.downloadFile(
              await doc.save(),
              `unlocked_${state.unlockFile.name}`,
              "application/pdf",
            );
          } catch (e) {
            alert("Sandi salah.");
          } finally {
            Utils.hideLoader();
          }
        };
      },
    },

    ESign: {
      init() {
        document.getElementById("esign-pdf-input").onchange = async (e) => {
          state.esignPdfFile = e.target.files[0];
          if (state.esignPdfFile) await this.populatePages();
          this.updateBtn();
        };
        document.getElementById("signature-image-input").onchange = (e) => {
          state.signatureImageFile = e.target.files[0];
          this.updateBtn();
        };
        document.getElementById("esign-page-select").onchange = () =>
          this.renderPreview();
        document.getElementById("esign-size-input").oninput = () =>
          this.updateIndicator();
        document.getElementById("esign-process-btn").onclick = () =>
          this.process();
      },
      updateBtn() {
        document.getElementById("esign-process-btn").disabled = !(
          state.esignPdfFile && state.signatureImageFile
        );
      },
      async populatePages() {
        const sel = document.getElementById("esign-page-select");
        sel.innerHTML = "";
        const pdf = await pdfjsLib.getDocument({
          data: await state.esignPdfFile.arrayBuffer(),
        }).promise;
        for (let i = 1; i <= pdf.numPages; i++)
          sel.add(new Option(`Hal ${i}`, i));
        sel.disabled = false;
        this.renderPreview();
      },
      async renderPreview() {
        const container = document.getElementById("esign-interactive-preview");
        const wrapper = document.getElementById("esign-preview-wrapper");
        wrapper.style.display = "block";
        container.innerHTML =
          '<div class="sig-indicator" style="display:none; position:absolute; border:2px dashed #10b981; background:rgba(16,185,129,0.1); pointer-events:none;"></div>';
        const pdf = await pdfjsLib.getDocument({
          data: await state.esignPdfFile.arrayBuffer(),
        }).promise;
        const page = await pdf.getPage(
          parseInt(document.getElementById("esign-page-select").value),
        );
        const v = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        canvas.width = v.width;
        canvas.height = v.height;
        container.style.width = v.width + "px";
        container.style.height = v.height + "px";
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: v,
        }).promise;
        container.prepend(canvas);
        container.onclick = (e) => {
          const rect = container.getBoundingClientRect();
          state.esignClickCoords = {
            x: e.clientX - rect.left,
            y: v.height - (e.clientY - rect.top),
          };
          this.updateIndicator(e.clientX - rect.left, e.clientY - rect.top);
        };
      },
      updateIndicator(x, y) {
        const ind = document.querySelector(".sig-indicator");
        if (!ind) return;
        const size = Number(document.getElementById("esign-size-input").value);
        ind.style.display = "block";
        ind.style.width = size + "px";
        ind.style.height = size / 1.5 + "px";
        if (x !== undefined) {
          ind.style.left = x - size / 2 + "px";
          ind.style.top = y - size / 3 + "px";
        }
      },
      async process() {
        Utils.showLoader("Menandatangani...");
        const doc = await PDFDocument.load(
          await state.esignPdfFile.arrayBuffer(),
        );
        const img =
          state.signatureImageFile.type === "image/png"
            ? await doc.embedPng(await state.signatureImageFile.arrayBuffer())
            : await doc.embedJpg(await state.signatureImageFile.arrayBuffer());
        const page =
          doc.getPages()[
            parseInt(document.getElementById("esign-page-select").value) - 1
          ];
        const size = Number(document.getElementById("esign-size-input").value),
          h = size / (img.width / img.height);
        let x = (page.getWidth() - size) / 2,
          y = 50;
        if (state.esignClickCoords) {
          x = state.esignClickCoords.x - size / 2;
          y = state.esignClickCoords.y - h / 2;
        }
        page.drawImage(img, { x, y, width: size, height: h });
        Utils.downloadFile(
          await doc.save(),
          `ttd_${state.esignPdfFile.name}`,
          "application/pdf",
        );
        Utils.hideLoader();
      },
    },

    OCR: {
      init() {
        const btn = document.getElementById("pdf-to-word-process-btn");
        document
          .getElementById("pdf-to-word-input")
          ?.addEventListener("change", (e) => {
            if (e.target.files[0]) {
              state.pdfToWordFile = e.target.files[0];
              btn.disabled = false;
            }
          });
        btn?.addEventListener("click", () => this.process());
      },
      async process() {
        const status = document.getElementById("pdf-to-word-status"),
          bar = document.getElementById("pdf-to-word-progress-bar");
        document.getElementById("pdf-to-word-progress").style.display = "block";
        try {
          const pdf = await pdfjsLib.getDocument({
            data: await state.pdfToWordFile.arrayBuffer(),
          }).promise;
          const worker = await Tesseract.createWorker(
            document.getElementById("ocr-language-select").value,
          );
          let html = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            status.textContent = `OCR Hal ${i}/${pdf.numPages}...`;
            const page = await pdf.getPage(i),
              v = page.getViewport({ scale: 2.5 });
            const canvas = document.createElement("canvas");
            canvas.width = v.width;
            canvas.height = v.height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, v.width, v.height);
            await page.render({ canvasContext: ctx, viewport: v }).promise;
            const res = await worker.recognize(canvas.toDataURL("image/png"));
            res.data.lines.forEach((l) => {
              const align =
                Math.abs((l.bbox.x0 + l.bbox.x1) / 2 - v.width / 2) <
                v.width * 0.1
                  ? "center"
                  : "left";
              html += `<p style="text-align:${align}; margin-left:${((l.bbox.x0 / v.width) * 100).toFixed(1)}%; font-family:serif;">${l.text.trim()}</p>`;
            });
            html += '<br clear="all" style="page-break-before:always" />';
            bar.value = (i / pdf.numPages) * 100;
          }
          await worker.terminate();
          const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${html}</body></html>`;
          Utils.downloadFile(
            new Blob(["\ufeff", docHtml], { type: "application/msword" }),
            state.pdfToWordFile.name.replace(".pdf", ".doc"),
          );
        } catch (e) {
          alert("OCR Gagal.");
        } finally {
          document.getElementById("pdf-to-word-progress").style.display =
            "none";
        }
      },
    },

    Extra: {
      init() {
        // Grayscale
        document.getElementById("grayscale-file-input").onchange = (e) => {
          if (e.target.files[0]) {
            state.grayscaleFile = e.target.files[0];
            document.getElementById("grayscale-process-btn").disabled = false;
          }
        };
        document.getElementById("grayscale-process-btn").onclick = async () => {
          Utils.showLoader("Grayscale...");
          const pdfjs = await pdfjsLib.getDocument({
            data: await state.grayscaleFile.arrayBuffer(),
          }).promise;
          const out = await PDFDocument.create();
          for (let i = 1; i <= pdfjs.numPages; i++) {
            const page = await pdfjs.getPage(i),
              v = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            canvas.width = v.width;
            canvas.height = v.height;
            const ctx = canvas.getContext("2d");
            await page.render({ canvasContext: ctx, viewport: v }).promise;
            const d = ctx.getImageData(0, 0, v.width, v.height);
            for (let j = 0; j < d.data.length; j += 4) {
              const avg = (d.data[j] + d.data[j + 1] + d.data[j + 2]) / 3;
              d.data[j] = d.data[j + 1] = d.data[j + 2] = avg;
            }
            ctx.putImageData(d, 0, 0);
            const img = await out.embedJpg(
              await (
                await fetch(canvas.toDataURL("image/jpeg", 0.8))
              ).arrayBuffer(),
            );
            out
              .addPage([v.width, v.height])
              .drawImage(img, { x: 0, y: 0, width: v.width, height: v.height });
          }
          Utils.downloadFile(
            await out.save(),
            `gray_${state.grayscaleFile.name}`,
            "application/pdf",
          );
          Utils.hideLoader();
        };
        // Extract Text
        document.getElementById("extract-text-file-input").onchange = async (
          e,
        ) => {
          const f = e.target.files[0];
          if (!f) return;
          Utils.showLoader("Ekstrak...");
          const pdf = await pdfjsLib.getDocument({
            data: await f.arrayBuffer(),
          }).promise;
          let txt = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const p = await pdf.getPage(i),
              c = await p.getTextContent();
            txt += `--- Hal ${i} ---\n${c.items.map((it) => it.str).join(" ")}\n\n`;
          }
          document.getElementById("extracted-text-area").value = txt;
          document.getElementById("extracted-text-container").style.display =
            "block";
          Utils.hideLoader();
        };
        document.getElementById("copy-text-btn").onclick = () => {
          document.getElementById("extracted-text-area").select();
          document.execCommand("copy");
          alert("Copied!");
        };
        // Metadata
        document.getElementById("metadata-file-input").onchange = async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          state.metadataFile = f;
          const doc = await PDFDocument.load(await f.arrayBuffer());
          document.getElementById("metadata-list").innerHTML =
            `<li>Judul: ${doc.getTitle() || "-"}</li><li>Penulis: ${doc.getAuthor() || "-"}</li><li>Produser: ${doc.getProducer() || "-"}</li>`;
          document.getElementById("metadata-info").style.display = "flex";
          document.getElementById("metadata-process-btn").disabled = false;
        };
        document.getElementById("metadata-process-btn").onclick = async () => {
          Utils.showLoader("Cleaning...");
          const doc = await PDFDocument.load(
            await state.metadataFile.arrayBuffer(),
          );
          doc.setTitle("");
          doc.setAuthor("");
          doc.setSubject("");
          doc.setCreator("");
          doc.setProducer("");
          Utils.downloadFile(
            await doc.save(),
            `clean_${state.metadataFile.name}`,
            "application/pdf",
          );
          Utils.hideLoader();
        };
      },
    },

    Scan: {
      images: [],
      stream: null,
      init() {
        document.getElementById("scan-init-block").onclick = () => this.start();
        document.getElementById("capture-btn").onclick = () => this.capture();
        document.getElementById("stop-camera-btn").onclick = () => this.stop();
        document.getElementById("scan-add-more").onclick = () => this.start();
        document.getElementById("generate-scan-pdf-btn").onclick = () =>
          this.generate();
      },
      async start() {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          const vid = document.getElementById("scan-video");
          vid.srcObject = this.stream;
          document.getElementById("scan-init-block").style.display = "none";
          document.getElementById("camera-container").style.display = "block";
        } catch (e) {
          alert("Akses kamera ditolak.");
        }
      },
      stop() {
        if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
        document.getElementById("camera-container").style.display = "none";
        document.getElementById(
          this.images.length ? "scan-actions" : "scan-init-block",
        ).style.display = "flex";
      },
      capture() {
        const vid = document.getElementById("scan-video"),
          canvas = document.createElement("canvas");
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        canvas.getContext("2d").drawImage(vid, 0, 0);
        this.images.push(canvas.toDataURL("image/jpeg", 0.8));
        this.render();
        vid.style.opacity = "0.5";
        setTimeout(() => (vid.style.opacity = "1"), 100);
        document.getElementById("scan-actions").style.display = "flex";
      },
      render() {
        const grid = document.getElementById("scan-preview-grid");
        grid.innerHTML = "";
        this.images.forEach((img, i) => {
          const d = document.createElement("div");
          d.className = "scan-preview-item";
          d.style.position = "relative";
          d.innerHTML = `<img src="${img}" style="width:100%; border-radius:8px;"><button onclick="window.removeScannedImage(${i})" style="position:absolute; top:-5px; right:-5px; background:#ef4444; color:white; border-radius:50%; width:24px; border:none;">&times;</button>`;
          grid.appendChild(d);
        });
      },
      async generate() {
        Utils.showLoader("Membuat PDF...");
        const doc = await PDFDocument.create(),
          filter = document.getElementById("scan-filter").value;
        for (const url of this.images) {
          const img = new Image();
          img.src = url;
          await new Promise((r) => (img.onload = r));
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          if (filter !== "none") {
            const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let j = 0; j < d.data.length; j += 4) {
              if (filter === "magic") {
                d.data[j] = (d.data[j] - 128) * 1.3 + 143;
                d.data[j + 1] = (d.data[j + 1] - 128) * 1.3 + 143;
                d.data[j + 2] = (d.data[j + 2] - 128) * 1.3 + 143;
              } else if (filter === "bw") {
                const g = (d.data[j] + d.data[j + 1] + d.data[j + 2]) / 3;
                const v = g > 120 ? 255 : 0;
                d.data[j] = d.data[j + 1] = d.data[j + 2] = v;
              } else if (filter === "grayscale") {
                const g = (d.data[j] + d.data[j + 1] + d.data[j + 2]) / 3;
                d.data[j] = d.data[j + 1] = d.data[j + 2] = g;
              }
            }
            ctx.putImageData(d, 0, 0);
          }
          const pImg = await doc.embedJpg(
            await (
              await fetch(canvas.toDataURL("image/jpeg", 0.85))
            ).arrayBuffer(),
          );
          doc.addPage([pImg.width, pImg.height]).drawImage(pImg, {
            x: 0,
            y: 0,
            width: pImg.width,
            height: pImg.height,
          });
        }
        Utils.downloadFile(
          await doc.save(),
          (document.getElementById("scan-filename").value || "scan") + ".pdf",
          "application/pdf",
        );
        this.images = [];
        this.render();
        this.stop();
        window.showChainedTask();
        Utils.hideLoader();
      },
    },
  };

  // 6. GLOBAL WINDOW FUNCTIONS (for index.html onclicks)
  window.switchTab = (id) => {
    const t = document.querySelector(`[data-tab="${id}"]`);
    if (t) {
      t.click();
      window.closeChainedTask();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  window.showChainedTask = () =>
    (document.getElementById("chained-task-container").style.display = "flex");
  window.closeChainedTask = () =>
    (document.getElementById("chained-task-container").style.display = "none");
  window.removeScannedImage = (i) => {
    Tools.Scan.images.splice(i, 1);
    Tools.Scan.render();
    if (!Tools.Scan.images.length) {
      document.getElementById("scan-actions").style.display = "none";
      document.getElementById("scan-init-block").style.display = "flex";
    }
  };

  // 7. INITIALIZE APP
  UI.init();
  Object.values(Tools).forEach((t) => t.init && t.init());
});
