function dev(){
    _.ById("section-main").Show(true);
    _.ById("prompt-loading").Show(false);
    _.ById("prompt-network").Show(false);

    // _.ById("my-data").Show(false);

    _.ById("info-me-unlock").Show(true);


    _.ById("info-me-status").Show(false);

    _.ById("info-me-status-healthy").Show(false);
    _.ById("info-me-status-infected").Show(false);
    _.ById("info-me-status-dead").Show(true);

    _.ById("section-unlock").Show(false);


    _.ById("me-infected").Show(false);
    _.ById("me-healthy").Show(false);
    _.ById("me-dead").Show(false);

}