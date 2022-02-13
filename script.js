document.addEventListener("DOMContentLoaded", () => {
  function addItem(alreadyBought) {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = "<span></span><button>X</button>";
    document.querySelectorAll(".itemList")[+!!alreadyBought].appendChild(div);
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
