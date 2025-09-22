import { useState } from "react"

function App() {
  // React state variables for prompts, results, and loading
  const [imagePrompt, setImagePrompt] = useState("")   // User input for image
  const [videoPrompt, setVideoPrompt] = useState("")   // User input for video
  const [imageResult, setImageResult] = useState(null) // Final image URL
  const [imageCost, setImageCost] = useState(null)     // Runware reported cost
  const [videoResult, setVideoResult] = useState(null) // Final video URL
  const [videoCost, setVideoCost] = useState(null)     // Runware reported cost
  const [loading, setLoading] = useState(false)        // Controls "loading" button state

  // Image Handler
  const handleImageGenerate = async () => {
    try {
      setLoading(true)
      // Call backend endpoint with the image prompt
      const resp = await fetch("https://runwarebackend.onrender.com/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      })
      const data = await resp.json()

      // Save image URL and cost for display
      setImageResult(data.imageURL)
      setImageCost(data.cost)
    } catch (err) {
      console.error(err)
      alert("Image generation failed")
    } finally {
      setLoading(false)
    }
  }

  // Video Handler (Async Workflow, Polling)
  const handleVideoGenerate = async () => {
    try {
      setLoading(true)
      // Submit the request, returns taskUUID (not the final video yet)
      const resp = await fetch("https://runwarebackend.onrender.com/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoPrompt }),
      })
      const { taskUUID, cost } = await resp.json()
      setVideoCost(cost)

      // Poll backend until video is ready
      let ready = false
      while (!ready) {
        await new Promise((r) => setTimeout(r, 5000)) // wait 5 sec
        const poll = await fetch("https://runwarebackend.onrender.com/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskUUID }),
        })
        const status = await poll.json()

        if (status.videoURL) {
          // Save final video and cost when ready
          setVideoResult(status.videoURL)
          setVideoCost(status.cost)
          ready = true
        }
      }
    } catch (err) {
      console.error(err)
      alert("Video generation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold">Runware API Demo</h1>
        </header>

        {/* Image Generator */}
        <section className="grid md:grid-cols-2 gap-8 items-start">
          {/* Inputs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Runware Image Generator</h2>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Input image prompt here"
              className="w-full p-3 border rounded-xl shadow-sm"
              rows="4"
            />
            <button
              onClick={handleImageGenerate}
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Image"}
            </button>
            {imageCost && <p className="text-sm text-gray-500">Cost: ${imageCost.toFixed(4)}</p>}
          </div>

          {/* Output */}
          <div className="flex items-center justify-center bg-white border rounded-xl shadow p-4 min-h-[300px]">
            {imageResult ? (
              <img src={imageResult} alt="Generated" className="rounded-lg max-h-[400px] object-contain" />
            ) : (
              <p className="text-gray-400">Image will appear here</p>
            )}
          </div>
        </section>

        {/* Video Generator */}
        <section className="grid md:grid-cols-2 gap-8 items-start">
          {/* Inputs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Runware Video Generator</h2>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Input video prompt here"
              className="w-full p-3 border rounded-xl shadow-sm"
              rows="4"
            />
            <button
              onClick={handleVideoGenerate}
              disabled={loading}
              className="w-full py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Video"}
            </button>
            {videoCost && <p className="text-sm text-gray-500">Cost: ${videoCost.toFixed(4)}</p>}
          </div>

          {/* Output */}
          <div className="flex items-center justify-center bg-white border rounded-xl shadow p-4 min-h-[300px]">
            {videoResult ? (
              <video src={videoResult} controls className="rounded-lg max-h-[400px]" />
            ) : (
              <p className="text-gray-400">Video will appear here</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
