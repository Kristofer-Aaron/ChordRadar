<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .suede-bg {
            position: relative;
            overflow: hidden;
        }

        .suede-bg canvas {
            position: absolute;
            inset: 0;

            width: 100%;
            height: 100%;

            z-index: 0;
            pointer-events: none;
        }

        .suede-bg > * {
            position: relative;
            z-index: 1;
        }
        body::before {
            content: "";
            position: fixed;
            inset: 0;

            pointer-events: none;
            z-index: 9999;

            background: radial-gradient(
                ellipse at top center,
                rgba(0,0,0,0) 0%,
                rgba(0,0,0,0.1) 40%,
                rgba(0,0,0,0.3) 70%,
                rgba(0,0,0,0.4) 100%
            );
        }
    
    </style>
</head>
<body style="margin: 0;">
    <div class="suede-bg" style="width: 100vw; height: 200vh;">

    </div>

<script>
function createSuedeTexture(container) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    container.prepend(canvas);

    function draw() {

        const w = container.clientWidth;
        const h = container.clientHeight;

        canvas.width = w;
        canvas.height = h;

        const img = ctx.createImageData(w, h);

        for (let i = 0; i < img.data.length; i += 4) {

            const grain = 40 + Math.random() * 30;

            img.data[i] = grain;
            img.data[i+1] = grain;
            img.data[i+2] = grain;
            img.data[i+3] = 255;
        }

        ctx.putImageData(img, 0, 0);
    }

    draw();

    new ResizeObserver(draw).observe(container);
}

document.querySelectorAll(".suede-bg")
    .forEach(createSuedeTexture);
</script>

</body>
</html>

