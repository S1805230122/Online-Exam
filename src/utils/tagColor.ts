import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
// 主题颜色
const theme = computed(() => settingsStore.theme);

/*标签颜色*/
export const getTagColor=(index: any) =>{
  const baseColor = theme.value; // 主题色
  // 将十六进制颜色转换为HSL格式
  const hslColor = hexToHSL(baseColor);
  // 计算新的色调值，确保它在0到360之间
  // 为了避免第一个和第二个标签颜色相同，我们从第二个标签开始应用色调增量
  const hueIncrement = 360 / (index < 2 ? 2 : index);
  const newHue = (hslColor.h + (index > 1 ? hueIncrement : 0)) % 360;
  // 返回新的HSL颜色值，并保持原始的饱和度和亮度
  return `hsl(${newHue}, 90%, 96%)`;
}

export const getFontColor=(index: any)=> {
  const baseColor = theme.value; // 主题色
  // 将十六进制颜色转换为HSL格式
  const hslColor = hexToHSL(baseColor);
  // 计算新的色调值，确保它在0到360之间
  // 为了避免第一个和第二个标签颜色相同，我们从第二个标签开始应用色调增量
  const hueIncrement = 360 / (index < 2 ? 2 : index);
  const newHue = (hslColor.h + (index > 1 ? hueIncrement : 0)) % 360;
  return `hsl(${newHue}, 70%, 50%)`; // 使用HSL颜色模式来调整颜色
}

export  const getBorderColor=(index: any)=> {
  const baseColor = theme.value; // 主题色
  // 将十六进制颜色转换为HSL格式
  const hslColor = hexToHSL(baseColor);
  // 计算新的色调值，确保它在0到360之间
  // 为了避免第一个和第二个标签颜色相同，我们从第二个标签开始应用色调增量
  const hueIncrement = 360 / (index < 2 ? 2 : index);
  const newHue = (hslColor.h + (index > 1 ? hueIncrement : 0)) % 360;
  return `hsl(${newHue}, 100%, 90%)`; // 使用HSL颜色模式来调整颜色
}

// 辅助函数，将十六进制颜色转换为HSL对象
function hexToHSL(hex: string) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if(max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    // @ts-ignore
    h /= 6;
  }

  // @ts-ignore
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return { h, s, l };
}

/*对题目选项渲染*/
export const getChooseLabel=(index:number|string)=>{
  let list=['A ','B ','C ','D ','E ','F ','G ','H ','I ','J ','K ','L ','M ','N ','O ','P ','Q ','R ','S ','T ','U ','V ','W ','X ','Y ','Z ']
  // @ts-ignore
  return list[index]
}
