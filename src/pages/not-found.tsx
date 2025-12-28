import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { tools } from '@/lib/tools'

export default function NotFound() {
  const navigate = useNavigate()
  
  // Get 6 popular tools to suggest
  const suggestedTools = tools
    .filter(tool => tool.path !== '/')
    .slice(0, 6)

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | utilities.my</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8">
          {/* 404 Header */}
          <div className="space-y-4">
            <h1 className="text-8xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-muted-foreground text-lg">
              Woah! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Suggested Tools */}
          <div className="pt-8 border-t">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center justify-center gap-2">
              <Search className="h-5 w-5" />
              Popular Tools
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suggestedTools.map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <tool.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-foreground">{tool.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
