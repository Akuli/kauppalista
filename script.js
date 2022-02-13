document.addEventListener("DOMContentLoaded", () => {
  function addItem(alreadyBought) {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = '<span></span><input style="display:none;" /><button>X</button>';
    document.querySelectorAll(".itemList")[+!!alreadyBought].appendChild(div);

    // Edit text when clicked
    div.querySelector("span").onclick = () => {
      div.querySelector("span").style.display = "none";
      div.querySelector("input").style.display = "";
      div.querySelector("input").value = div.querySelector("span").textContent;
      div.querySelector("input").select();
      div.querySelector("input").focus();
    };

    // Text editing is done when unfocusing
    function endTextEditing() {
      div.querySelector("input").style.display = "none";
      div.querySelector("span").style.display = "";
      div.querySelector("span").textContent = div.querySelector("input").value;
    }
    div.querySelector("input").addEventListener("focusout", endTextEditing);
    div.querySelector("input").addEventListener("keyup", e => {if(e.key=="Enter") endTextEditing()});

    // Delete when X button is clicked
    div.querySelector("button").onclick = () => {
      const text = div.querySelector("span").textContent;
      if (confirm(`Delete item "${text}"?`)) {
        div.remove();
      }
    };

    return div;
  }

  addItem(false).querySelector("span").textContent = "gluten-free bread";
  addItem(true).querySelector("span").textContent = "milk 1";
  addItem(true).querySelector("span").textContent = "milk 2";
  addItem(true).querySelector("span").textContent = "milk 3";
});
