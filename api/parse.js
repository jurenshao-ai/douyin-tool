module.exports = async function handler(req, res) {
  try {
    let url = req.query.url;

    if (!url) {
      return res.status(400).json({ error: "缺少 url 参数" });
    }

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)",
      },
    });

    const realUrl = response.url;

    return res.status(200).json({
      success: true,
      realUrl,
    });

  } catch (e) {
    return res.status(500).json({
      error: "解析失败",
      detail: e.message,
    });
  }
};
