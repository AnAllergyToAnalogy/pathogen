_ = document;

Node.prototype.ById =
    Document.prototype.ById =
        HTMLCollection.prototype.ById = function(id) {
            return this.getElementById(id);
        };
Node.prototype.ByName =
    Document.prototype.ByName =
        HTMLCollection.prototype.ByName = function(name) {
            return this.getElementsByName(name);
        };
Node.prototype.ByClass =
    Document.prototype.ByClass =
        HTMLCollection.prototype.ByClass = function(className) {
            return this.getElementsByClassName(className);
        };
Node.prototype.ByTag =
    Document.prototype.ByTag =
        HTMLCollection.prototype.ByTag = function(tag) {
            return this.getElementsByTagName(tag);
        };
Node.prototype.OnClick =
    Document.prototype.OnClick =
        Element.prototype.OnClick = function(action){
            this.addEventListener("click", function(event){
                event.preventDefault();
                action(event);
            });
        };

Element.prototype.Show = function(onOff){
    if(onOff){
        this.style.display = "";
    }else{
        this.style.display = "none";
    }
}
Element.prototype.Toggle = function(){
    if(this.style.display === "none"){
        this.Show(true);
        // console.log('toggle on');
    }else{
        this.Show(false);
        // console.log('toggle off');
    }
}

Element.prototype.SetText = function(text){
    this.innerText = text;
}
Element.prototype.SetHTML = function(html){
    this.innerHTML = html;
}


