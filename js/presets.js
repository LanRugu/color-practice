/** 中国传统美色 — 经典预设（可在此文件继续补充） */
(function (global) {
  var PRESETS = [
    {
      id: 'gugong',
      name: '故宫红墙',
      desc: '宫墙朱红、琉璃黄与汉白玉，庄重大气，常见于宫廷与庙堂建筑。',
      colors: ['#C3272B', '#F0C239', '#F5F0E6'],
      baseColor: '#C3272B',
      scheme: 'complementary',
      tags: ['宫廷'],
    },
    {
      id: 'qinghua',
      name: '青花瓷韵',
      desc: '钴蓝与白瓷相映，青花晕染，清雅素净，如宋元青花瓷器之色。',
      colors: ['#1A5599', '#F7F4ED', '#6B98C4'],
      baseColor: '#1A5599',
      scheme: 'analogous',
      tags: ['陶瓷'],
    },
    {
      id: 'shuimo',
      name: '水墨江南',
      desc: '浓墨、淡墨与宣纸米白，留白写意，如江南水乡水墨画卷。',
      colors: ['#2C2C2C', '#8A8A8A', '#F0EBE3'],
      baseColor: '#2C2C2C',
      scheme: 'monochromatic',
      tags: ['水墨'],
    },
    {
      id: 'dunhuang',
      name: '敦煌遗彩',
      desc: '石青、朱砂与土黄，取自敦煌壁画矿物颜料，古拙而热烈。',
      colors: ['#1685A9', '#C32136', '#C89351'],
      baseColor: '#1685A9',
      scheme: 'triadic',
      tags: ['壁画'],
    },
    {
      id: 'chuntao',
      name: '春桃夹岸',
      desc: '桃夭、柳绿与杏黄，春意盎然，如桃花流水、夹岸花开的时节。',
      colors: ['#F091A0', '#86A873', '#F3D58C'],
      baseColor: '#F091A0',
      scheme: 'analogous',
      tags: ['春景'],
    },
    {
      id: 'daishan',
      name: '黛山远岚',
      desc: '黛青、岚灰与烟白，远山如黛、薄雾轻笼，含蓄而深远。',
      colors: ['#475164', '#A8B4C4', '#EDE8E0'],
      baseColor: '#475164',
      scheme: 'monochromatic',
      tags: ['山水'],
    },
    {
      id: 'jilan',
      name: '霁蓝釉色',
      desc: '霁蓝、象牙白与描金，如明代霁蓝釉瓷器，深邃中见华贵。',
      colors: ['#3E7B9E', '#FFFFF0', '#C9A227'],
      baseColor: '#3E7B9E',
      scheme: 'split-complementary',
      tags: ['瓷器'],
    },
    {
      id: 'yanyu',
      name: '烟雨青苔',
      desc: '天青、薄墨与苔绿，雨后苔痕、烟笼远树，湿润而清寂。',
      colors: ['#7898AA', '#5C6B73', '#6E8B74'],
      baseColor: '#7898AA',
      scheme: 'analogous',
      tags: ['江南'],
    },
  ];

  function getPreset(id) {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.presets = {
    PRESETS: PRESETS,
    getPreset: getPreset,
  };
})(window);
