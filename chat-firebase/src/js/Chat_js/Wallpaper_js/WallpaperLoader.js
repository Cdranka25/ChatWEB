// Importa automaticamente todos os arquivos dentro de /src/Assets/Wallpapers
function importAll(r) {
    let images = {};
    r.keys().forEach((key) => {
        const name = key.replace("./", "").replace(/\.(png|jpe?g|gif)$/i, "");
        images[name] = r(key);
    });
    return images;
}

export const WALLPAPERS = importAll(
    require.context("../../../Assets/Wallpapers", false, /\.(png|jpe?g|gif)$/i)

);
