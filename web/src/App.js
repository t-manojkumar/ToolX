import React, { useState, useEffect } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  shorthands,
  Button,
  Spinner,
  Title1,
  Body1,
  Card,
  CardHeader,
  CardPreview,
  Input,
  Label,
  Slider,
  Text,
  useId,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
} from "@fluentui/react-components";
import {
  Home24Regular,
  ImageSearch24Regular,
  VideoClip24Regular,
  ArrowExpand24Regular,
  Grid24Regular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
} from "@fluentui/react-icons";

// --- STYLES (using Fluent UI's makeStyles) ---
const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "60px",
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.padding("8px", "0px"),
    ...shorthands.borderRight("1px", "solid", "var(--colorNeutralStroke2)"),
  },
  sidebarButton: {
    width: "48px",
    height: "48px",
    ...shorthands.margin("4px", "0px"),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    flex: 1,
    ...shorthands.padding("24px"),
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    ...shorthands.padding("0", "0", "24px", "0"),
    ...shorthands.borderBottom("1px", "solid", "var(--colorNeutralStroke2)"),
    marginBottom: "24px",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "600px",
    marginBottom: "24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    ...shorthands.gap("16px"),
  },
  card: {
    textAlign: "center",
  },
  bestCard: {
    ...shorthands.border("2px", "solid", "var(--colorPaletteGreenBorderActive)"),
  },
  spinnerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "200px",
  },
});

// --- HELPER: File to Base64 Converter ---
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
});

// --- UI COMPONENTS ---

const HomePage = () => (
    <div>
        <Title1>Welcome to Your Image & Video Toolkit</Title1>
        <Body1>Select a tool from the sidebar on the left to get started.</Body1>
    </div>
);

const BestImageViewer = ({ showToast }) => {
    const styles = useStyles();
    const inputId = useId("file-input");
    const [images, setImages] = useState([]);
    const [bestImage, setBestImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e) => {
        if (e.target.files.length > 0) {
            setBestImage(null);
            const fileList = Array.from(e.target.files);
            const b64Promises = fileList.map(file => toBase64(file));
            const b64Images = await Promise.all(b64Promises);
            setImages(b64Images);
        }
    };

    const findBest = async () => {
        if (images.length < 2) {
            showToast("Please select at least two images to compare.", "error");
            return;
        }
        setIsLoading(true);
        setBestImage(null);
        // Call Python function exposed by Eel
        const result = await window.eel.find_best_image(images)();
        if (result && !result.error) {
            setBestImage(result);
            showToast(`Found best image with score: ${result.overall_score.toFixed(3)}`, "success");
        } else {
            showToast(result.error || "An unknown error occurred.", "error");
        }
        setIsLoading(false);
    };

    return (
        <div>
            <Title1 as="h1" className={styles.header}>Find Best Image</Title1>
            <div className={styles.controls}>
                <Label htmlFor={inputId}>Select multiple images to compare:</Label>
                <Input type="file" id={inputId} multiple accept="image/*" onChange={handleFileChange} />
                <Button appearance="primary" onClick={findBest} disabled={isLoading || images.length < 2}>
                    {isLoading ? "Analyzing..." : "Find Best Image"}
                </Button>
            </div>
            {isLoading && <div className={styles.spinnerContainer}><Spinner size="huge" label="Analyzing images..." /></div>}
            <div className={styles.grid}>
                {images.map((img, index) => (
                    <Card key={index} className={`${styles.card} ${bestImage?.index === index ? styles.bestCard : ''}`}>
                        <CardPreview>
                            <img src={img} alt={`upload-${index}`} style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        </CardPreview>
                        <CardHeader header={<Body1>{bestImage?.index === index ? <b>Best! (Score: {bestImage.overall_score.toFixed(2)})</b> : `Image ${index + 1}`}</Body1>} />
                    </Card>
                ))}
            </div>
        </div>
    );
};

const FrameExtractor = ({ showToast }) => {
    const styles = useStyles();
    const inputId = useId("video-input");
    const [frames, setFrames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e) => {
        if (e.target.files.length > 0) {
            setIsLoading(true);
            setFrames([]);
            const file = e.target.files[0];
            const video_b64 = await toBase64(file);
            // Call Python function
            const result = await window.eel.extract_frames_from_video(video_b64, file.name)();
            if (result && !result.error) {
                setFrames(result);
                showToast(`Extracted ${result.length} frames.`, "success");
            } else {
                showToast(result.error || "Failed to extract frames.", "error");
            }
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Title1 as="h1" className={styles.header}>Extract Frames from Video</Title1>
            <div className={styles.controls}>
                <Label htmlFor={inputId}>Select a video file:</Label>
                <Input type="file" id={inputId} accept="video/*" onChange={handleFileChange} disabled={isLoading} />
            </div>
            {isLoading && <div className={styles.spinnerContainer}><Spinner size="huge" label="Extracting frames..." /></div>}
            <div className={styles.grid}>
                {frames.map((frame, index) => (
                    <Card key={index} className={styles.card}>
                        <CardPreview>
                            <img src={frame} alt={`frame-${index}`} style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        </CardPreview>
                         <CardHeader header={<Body1>{`Frame ${index + 1}`}</Body1>} />
                    </Card>
                ))}
            </div>
        </div>
    );
};

const Upscaler = ({ showToast }) => {
    const styles = useStyles();
    const inputId = useId("upscale-input");
    const [originalImage, setOriginalImage] = useState(null);
    const [upscaledImage, setUpscaledImage] = useState(null);
    const [scale, setScale] = useState(2);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e) => {
        if (e.target.files.length > 0) {
            setUpscaledImage(null);
            const file = e.target.files[0];
            const b64Image = await toBase64(file);
            setOriginalImage(b64Image);
        }
    };

    const runUpscale = async () => {
        if (!originalImage) {
            showToast("Please select an image first.", "error");
            return;
        }
        setIsLoading(true);
        setUpscaledImage(null);
        // Call Python function
        const result = await window.eel.upscale_image(originalImage, scale)();
        if (result && !result.error) {
            setUpscaledImage(result);
            showToast(`Image upscaled by ${scale}x.`, "success");
        } else {
            showToast(result.error || "Failed to upscale image.", "error");
        }
        setIsLoading(false);
    };

    return (
        <div>
            <Title1 as="h1" className={styles.header}>Image Upscaler</Title1>
            <div className={styles.controls}>
                <Label htmlFor={inputId}>Select an image to upscale:</Label>
                <Input type="file" id={inputId} accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                <Label htmlFor="scale-slider">Upscale Factor: {scale}x</Label>
                <Slider id="scale-slider" min={2} max={8} step={1} value={scale} onChange={(_, data) => setScale(data.value)} />
                <Button appearance="primary" onClick={runUpscale} disabled={isLoading || !originalImage}>
                    {isLoading ? "Upscaling..." : "Upscale Image"}
                </Button>
            </div>
            {isLoading && <div className={styles.spinnerContainer}><Spinner size="huge" label="Processing..." /></div>}
            <div className={styles.grid} style={{ gridTemplateColumns: "1fr 1fr" }}>
                {originalImage && <Card><CardHeader header={<Title1>Original</Title1>}/><CardPreview><img src={originalImage} alt="Original" style={{ width: '100%' }} /></CardPreview></Card>}
                {upscaledImage && <Card><CardHeader header={<Title1>Upscaled</Title1>}/><CardPreview><img src={upscaledImage} alt="Upscaled" style={{ width: '100%' }} /></CardPreview></Card>}
            </div>
        </div>
    );
};

const Splitter = ({ showToast }) => {
    const styles = useStyles();
    const inputId = useId("split-input");
    const [image, setImage] = useState(null);
    const [parts, setParts] = useState([]);
    const [rows, setRows] = useState(1);
    const [cols, setCols] = useState(2);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (e) => {
        if (e.target.files.length > 0) {
            setParts([]);
            const file = e.target.files[0];
            const b64Image = await toBase64(file);
            setImage(b64Image);
        }
    };

    const runSplit = async () => {
        if (!image) {
            showToast("Please select an image first.", "error");
            return;
        }
        setIsLoading(true);
        setParts([]);
        const result = await window.eel.split_image(image, rows, cols)();
        if (result && !result.error) {
            setParts(result);
            showToast(`Image split into ${result.length} parts.`, "success");
        } else {
            showToast(result.error || "Failed to split image.", "error");
        }
        setIsLoading(false);
    };

    return (
        <div>
            <Title1 as="h1" className={styles.header}>Image Splitter</Title1>
            <div className={styles.controls}>
                <Label htmlFor={inputId}>Select an image to split:</Label>
                <Input type="file" id={inputId} accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div>
                        <Label htmlFor="rows-input">Rows</Label>
                        <Input id="rows-input" type="number" min={1} value={rows} onChange={(_, data) => setRows(Number(data.value))} />
                    </div>
                    <div>
                        <Label htmlFor="cols-input">Columns</Label>
                        <Input id="cols-input" type="number" min={1} value={cols} onChange={(_, data) => setCols(Number(data.value))} />
                    </div>
                </div>
                <Button appearance="primary" onClick={runSplit} disabled={isLoading || !image}>
                    {isLoading ? "Splitting..." : "Split Image"}
                </Button>
            </div>
            {isLoading && <div className={styles.spinnerContainer}><Spinner size="huge" label="Splitting..." /></div>}
            <div className={styles.grid}>
                {parts.map((part, index) => (
                    <Card key={index} className={styles.card}>
                        <CardPreview>
                            <img src={part} alt={`part-${index}`} style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        </CardPreview>
                        <CardHeader header={<Body1>{`Part ${index + 1}`}</Body1>} />
                    </Card>
                ))}
            </div>
        </div>
    );
};


// --- Main App Component ---
function App() {
  const styles = useStyles();
  const [theme, setTheme] = useState(webLightTheme);
  const [currentPage, setCurrentPage] = useState("home");
  
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const showToast = (message, type = "success") => {
    const intent = type === "success" ? "success" : "error";
    const icon = type === "success" ? <CheckmarkCircle24Filled /> : <ErrorCircle24Filled />;
    dispatchToast(
        <Toast>
            <ToastTitle action={{
                alt: 'Close toast',
                'aria-label': 'Close toast',
                children: 'x'
            }}
            media={icon}
            >{type.charAt(0).toUpperCase() + type.slice(1)}</ToastTitle>
            <ToastBody>{message}</ToastBody>
        </Toast>,
        { intent, position: "top-end", timeout: 3000 }
    );
  };
  
  // Detect system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? webDarkTheme : webLightTheme);
    const handler = (e) => setTheme(e.matches ? webDarkTheme : webLightTheme);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "home": return <HomePage />;
      case "best-image": return <BestImageViewer showToast={showToast} />;
      case "extractor": return <FrameExtractor showToast={showToast} />;
      case "upscaler": return <Upscaler showToast={showToast} />;
      case "splitter": return <Splitter showToast={showToast} />;
      default: return <HomePage />;
    }
  };

  return (
    <FluentProvider theme={theme}>
      <div className={styles.root}>
        <nav className={styles.sidebar}>
          <Button icon={<Home24Regular />} className={styles.sidebarButton} appearance={currentPage === 'home' ? 'primary' : 'transparent'} onClick={() => setCurrentPage('home')} />
          <Button icon={<ImageSearch24Regular />} className={styles.sidebarButton} appearance={currentPage === 'best-image' ? 'primary' : 'transparent'} onClick={() => setCurrentPage('best-image')} />
          <Button icon={<VideoClip24Regular />} className={styles.sidebarButton} appearance={currentPage === 'extractor' ? 'primary' : 'transparent'} onClick={() => setCurrentPage('extractor')} />
          <Button icon={<ArrowExpand24Regular />} className={styles.sidebarButton} appearance={currentPage === 'upscaler' ? 'primary' : 'transparent'} onClick={() => setCurrentPage('upscaler')} />
          <Button icon={<Grid24Regular />} className={styles.sidebarButton} appearance={currentPage === 'splitter' ? 'primary' : 'transparent'} onClick={() => setCurrentPage('splitter')} />
        </nav>
        <main className={styles.mainContent}>
          {renderPage()}
        </main>
      </div>
      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
}

export default App;