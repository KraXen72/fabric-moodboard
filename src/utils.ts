export function debounce(func: Function, timeout = 300){
  let timer: number;
	//@ts-ignore
  return (...args) => {
    clearTimeout(timer);
		//@ts-ignore
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// function injectCSS(css) {
//   const styleTag = document.createElement("style")
//   styleTag.innerHTML = css
//   document.head.appendChild(styleTag)
// }