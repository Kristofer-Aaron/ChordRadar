alert("start");
console.log("huh");
function createSuedeTexture(container) {

    if (container.querySelector("canvas")) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    container.prepend(canvas);

    function draw(width, height) {

        if (canvas.width === width && canvas.height === height) return;

        canvas.width = width;
        canvas.height = height;

        const img = ctx.createImageData(width, height);

        for (let i = 0; i < img.data.length; i += 4) {
            const grain = 100 + Math.random() * 30;

            img.data[i]     = grain + 10;
            img.data[i + 1] = grain + 5;
            img.data[i + 2] = grain;
            img.data[i + 3] = 255;
        }

        ctx.putImageData(img, 0, 0);
    }

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            draw(Math.floor(width), Math.floor(height));
        }
    });

    observer.observe(container);
}
createSuedeTexture(
document.querySelector("body"));
alert("done");
