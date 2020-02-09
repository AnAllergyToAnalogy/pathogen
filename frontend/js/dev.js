let redraw;
function dev(){
    _.ById("section-main").Show(true);
    _.ById("prompt-loading").Show(false);
    _.ById("prompt-network").Show(false);


    _.ById("info-me-unlock").Show(true);


    _.ById("info-me-status").Show(false);

    _.ById("info-me-status-healthy").Show(false);
    _.ById("info-me-status-infected").Show(false);
    _.ById("info-me-status-dead").Show(true);

    _.ById("section-unlock").Show(false);

    _.ById("my-data").Show(true);

    _.ById("me-loading").Show(false);

    _.ById("me-infected").Show(false);
    _.ById("me-healthy").Show(true);
    _.ById("me-dead").Show(false);


    var site = {
        graph: {
            xMin: 0,
            xMax: 50,
            yMin: 0,
            yMax: 5,
            width: 200,
            height: 100
        }
    }

    var game = {
        graph: [
            {
                block: 5,
                infections: 1
            },
            {
                block: 12,
                infections: 2
            },
            {
                block: 25,
                infections: 3
            },
            {
                block: 40,
                infections: 4
            },
            {
                block: 50,
                infections: 5
            },

        ]
    }

    function X_to_x(X){
        var G = site.graph;
        return (X - G.xMin)/(G.xMax - G.xMin) * G.width;
    }
    function Y_to_y(Y){
        var G = site.graph;
        return ( 1 - (Y - G.yMin)/(G.yMax - G.yMin)) * G.height;
    }


    function redraw_graph(width){
        // const width = window.innerWidth;
        const height = Math.round(width/3*2);
        let G = site.graph;
        G.width = width;
        G.height = height;


        const canvas = _.ById("graph-canvas");
        canvas.width = width;
        canvas.height = height;

        _.ById("graph-labels-y").height = height;
        _.ById("graph-labels-x").style = "width:"+width+"px";

        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeRect(0, 0, G.width, G.height);

        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.moveTo(0, G.height);

        for(let i = 0; i < game.graph.length; i++){
            console.log(
                X_to_x(game.graph[i].block),
                Y_to_y(game.graph[i].infections)
            );
            ctx.lineTo(
                X_to_x(game.graph[i].block),
                Y_to_y(game.graph[i].infections)
            )
        }

        ctx.stroke();
    }

    redraw = redraw_graph;

    redraw_graph(window.innerWidth - 50);
}