module.exports = async function handler(req, res) {
  // 设置跨域允许
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ success: false, error: "缺少 url 参数" });
    }

    // 🌟 终极方案：调用稳定的第三方免费解析接口 (TenAPI)
    // 直接把清洗好的抖音链接发给第三方，由他们处理复杂的 X-Bogus 签名和 IP 代理池
    const apiUrl = `https://tenapi.cn/v2/douyin?url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        // 给第三方接口也加个基础伪装，防止被第三方接口拦截
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      }
    });

    const data = await response.json();

    // 第三方接口返回 code: 200 表示解析成功
    if (data.code === 200 && data.data) {
      return res.status(200).json({
        success: true,
        video: data.data.url,     // 第三方提取好的无水印视频直链
        desc: data.data.title,    // 视频文案标题
      });
    } else {
      // 如果第三方也解析失败，抛出他们的错误信息
      throw new Error(data.msg || "未找到视频数据");
    }

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "服务器解析异常",
      detail: e.message,
    });
  }
};
