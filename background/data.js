function Data() {

}

Data.ContentTypes = {
    MEDIA: ["audio/mpeg"],
    IMAGE: ["image/jpeg"],
    TEXT: ["text/html"]
};

Data.prototype.getLibrary = function() {
    return [
        "https://zingmp3.vn/*",
        "https://nhac.vn/*"
    ];
}