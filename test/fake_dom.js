function create_node(tag) {
  let node = {
    tag,
    className: "",
    children: [],
    handlers: {},
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(event, handler) {
      this.handlers[event] = handler;
    },
    append(...nodes) {
      for (let node of nodes) {
        node.parent = this;
        this.children.push(node);
      }
    },
    appendChild(node) {
      node.parent = this;
      this.children.push(node);
    },
    remove() {
      if (!this.parent) {
        return;
      }
      let index = this.parent.children.indexOf(this);
      if (index >= 0) {
        this.parent.children.splice(index, 1);
      }
      this.parent = null;
    },
    getElementsByTagName(name) {
      let found = [];
      for (let child of this.children) {
        if (child.tag === name) {
          found.push(child);
        }
        found.push(...child.getElementsByTagName(name));
      }
      return found;
    },
    getElementsByClassName(name) {
      let found = [];
      for (let child of this.children) {
        if (child.className.split(/\s+/).includes(name)) {
          found.push(child);
        }
        found.push(...child.getElementsByClassName(name));
      }
      return found;
    },
    focus() {
      this.focused = true;
    },
  };

  Object.defineProperty(node, "innerHTML", {
    get() {
      return "";
    },
    set(value) {
      if (value === "") {
        this.children = [];
      }
    },
    configurable: true,
  });

  return node;
}

function make_value_box(count) {
  let box = create_node("div");
  for (let index = 0; index < count; index++) {
    let wrapper = create_node("div");
    let area = create_node("textarea");
    let remove = create_node("button");

    wrapper.className = "column";
    area.id = "c" + (index + 1);
    area.value = "";
    remove.className = "btn-remove";
    wrapper.append(area, remove);
    box.appendChild(wrapper);
  }
  return box;
}

module.exports = { create_node, make_value_box };
