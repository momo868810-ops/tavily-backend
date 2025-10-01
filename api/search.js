// api/search.js

const { tavily } = require('@tavily/core');

// 初始化 Tavily 客户端。
// process.env.TAVILY_API_KEY 会自动从 Vercel 的环境变量中读取，非常安全。
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

// 这是 Vercel 会运行的主函数
export default async function handler(req, res) {
  // 设置 CORS 响应头，允许任何来源的请求（用于开发）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 如果是 OPTIONS 预检请求，直接返回成功
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 确保是 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 从前端发来的请求体中获取查询内容
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // 使用 Tavily API 进行搜索
    const searchResponse = await client.search(query, { search_depth: 'basic' });

    // 将搜索结果返回给前端
    res.status(200).json(searchResponse);

  } catch (error) {
    console.error('Tavily search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
}