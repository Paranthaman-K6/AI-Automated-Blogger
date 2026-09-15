import robotsParser from 'robots-parser';

export async function checkRobots(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      return true;
    }
    
    const robotsTxt = await response.text();
    const robots = (robotsParser as any)(robotsUrl, robotsTxt);
    
    return robots.isAllowed(url, 'AutomatedBloggerBot') ?? true;
  } catch (error) {
    return true;
  }
}
