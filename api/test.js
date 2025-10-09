// Simple test endpoint to verify serverless function works
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.SUPABASE_URL
  });
};
