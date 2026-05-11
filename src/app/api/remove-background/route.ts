import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image");
  const model = String(formData.get("model") || "isnet-general-use");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image upload." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image is too large. Maximum size is 15MB." }, { status: 413 });
  }

  const workDir = path.join(tmpdir(), `iconslicer-rembg-${randomUUID()}`);
  const inputPath = path.join(workDir, "input.png");
  const outputPath = path.join(workDir, "output.png");

  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    await runRembgLibrary(inputPath, outputPath, model);

    const output = await readFile(outputPath);
    return new NextResponse(output, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown rembg failure.";
    return NextResponse.json(
      {
        error: message,
        hint: 'Install rembg locally with: pip install "rembg[cpu,cli]"',
      },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function runRembgLibrary(inputPath: string, outputPath: string, model: string) {
  const script = `
from rembg import remove, new_session

input_path = ${JSON.stringify(inputPath)}
output_path = ${JSON.stringify(outputPath)}
model = ${JSON.stringify(model)}

session = new_session(model)
with open(input_path, "rb") as source:
    output = remove(source.read(), session=session, force_return_bytes=True)
with open(output_path, "wb") as target:
    target.write(output)
`;

  return resolvePythonBinary().then((pythonBin) => new Promise<void>((resolve, reject) => {
    const child = spawn(pythonBin, ["-c", script], {
      env: {
        ...process.env,
        PATH: buildPythonAwarePath(),
        OMP_NUM_THREADS: process.env.OMP_NUM_THREADS || "4",
      },
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`Unable to start Python at ${pythonBin}: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `rembg Python process exited with code ${code}`));
    });
  }));
}

async function resolvePythonBinary() {
  const candidates = [
    process.env.REMBG_PYTHON_BIN,
    "/Library/Developer/CommandLineTools/usr/bin/python3",
    "python3",
    "python",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate === "python3" || candidate === "python") return candidate;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known install location.
    }
  }

  return "python3";
}

function buildPythonAwarePath() {
  const home = process.env.HOME || "";
  const pythonBins = ["3.13", "3.12", "3.11", "3.10", "3.9"].map((version) =>
    path.join(home, `Library/Python/${version}/bin`)
  );

  return [...pythonBins, process.env.PATH || ""].join(path.delimiter);
}
