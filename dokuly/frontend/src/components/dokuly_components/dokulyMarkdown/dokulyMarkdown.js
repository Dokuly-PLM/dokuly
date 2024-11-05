import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Prism from "prismjs";
import { getImage } from "../funcitons/queries";
import "prismjs/themes/prism-tomorrow.css";

import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-python";
import "prismjs/components/prism-julia";
import "prismjs/components/prism-matlab";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-nginx";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-go";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-regex";
import "prismjs/components/prism-markdown";

import DokulyMarkdownTable from "./components/markdownTable";
import { ColorRenderer, hexColorRegex } from "./components/colorRenderer";

const blockquoteStyles = {
  WARNING: {
    icon: (
      <img
        className="dokuly-filter-warning"
        src="../../../../static/icons/exclamation-lg.svg"
        alt="Warning"
        width={50}
        style={{ border: "none" }}
      />
    ),
  },
  DANGER: {
    icon: (
      <img
        className="dokuly-filter-danger"
        src="../../../../static/icons/alert-triangle.svg"
        alt="Danger"
        width={50}
        style={{ border: "none" }}
      />
    ),
  },
  INFO: {
    icon: (
      <img
        className="dokuly-filter-blue"
        src="../../../../static/icons/info-lg.svg"
        alt="Info"
        width={50}
        style={{ border: "none" }}
      />
    ),
  },
  QUOTE: {
    icon: (
      <img
        className="dokuly-filter-black"
        src="../../../../static/icons/quote.svg"
        alt="Quote"
        width={50}
        style={{ border: "none" }}
      />
    ),
  },
};

const BlockquoteComponent = ({ children }) => {
  let type = null; // Default to null to signify no type
  let finalChildren = [];

  // Function to extract and clean type from child text
  const extractTypeAndText = (text) => {
    const regex = /^!(WARNING|DANGER|INFO|QUOTE)\s+(.*)$/; // Ensure regex accounts for required space
    const matches = text.match(regex);
    if (matches) {
      type = matches[1]; // Extract type
      return matches[2]; // Return the rest of the text without the prefix
    }
    return text; // Return original text if no type prefix found
  };

  // Process each child, dive into paragraph if necessary
  React.Children.forEach(children, (child) => {
    if (typeof child === "string") {
      finalChildren.push(extractTypeAndText(child));
    } else if (child && child.props && child.props.children) {
      if (typeof child.props.children === "string") {
        finalChildren.push(extractTypeAndText(child.props.children));
      } else if (Array.isArray(child.props.children)) {
        // If the children array has more elements (mixed content inside the paragraph)
        const processedChildren = child.props.children.map((subChild) =>
          typeof subChild === "string" ? extractTypeAndText(subChild) : subChild
        );
        finalChildren.push(
          React.cloneElement(child, {
            ...child.props,
            children: processedChildren,
          })
        );
      } else {
        finalChildren.push(child);
      }
    } else {
      finalChildren.push(child);
    }
  });

  const style = blockquoteStyles[type] || {}; // Get styles if type was found

  return (
    <blockquote
      style={{
        padding: "10px 20px",
        margin: "0 0 20px",
        position: "relative",
        color: "black",
        backgroundColor: "#f9f9f9",
        border: "0.25px solid #ddd",
        borderRadius: "5px",
      }}
    >
      {style.icon && (
        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
          {style.icon}
        </div>
      )}
      <div style={{ paddingLeft: style.icon ? "50px" : "10px" }}>
        {finalChildren}
      </div>
    </blockquote>
  );
};

const parseStyle = (styleString) => {
  const styles = {};
  const styleArray = styleString.split(";");
  for (const style of styleArray) {
    const [key, value] = style.split(":");
    if (key && value) {
      styles[key.trim()] = value.trim();
    }
  }
  return styles;
};

const ImageComponent = React.memo(({ src, alt, title }) => {
  const [imageUrl, setImageUrl] = useState(src);
  const [style, setStyle] = useState({ maxWidth: "100%" });

  useEffect(() => {
    if (title) {
      setStyle((currentStyle) => ({
        ...currentStyle,
        ...parseStyle(title),
      }));
    }
  }, [title]);

  useEffect(() => {
    let active = true;
    const fetchImage = async () => {
      if (src.startsWith("/api/files/images/download/")) {
        const imageId = src.split("/")[5];
        try {
          const response = await getImage(imageId);
          if (active) {
            const url = URL.createObjectURL(response.data);
            setImageUrl(url);
          }
        } catch (error) {
          console.error("Error fetching image:", error);
          setImageUrl("/path/to/default/image.jpg");
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [src]);

  const handleDownloadOriginal = useCallback(async () => {
    const imageId = src.split("/")[5];
    try {
      const response = await getImage(imageId, "original");
      const blob = response.data;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${alt}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading original image:", error);
    }
  }, [src, alt]);

  return (
    <figure className="hoverable-figure">
      <img src={imageUrl} alt={alt} style={style} />
      {alt && (
        <figcaption style={{ fontSize: "0.9em", color: "#666" }}>
          {alt}
        </figcaption>
      )}
      <img
        src="../../static/icons/file-download.svg"
        alt="download"
        className="download-icon"
        title="Download original image"
        onClick={handleDownloadOriginal}
      />
    </figure>
  );
});

const DokulyMarkdown = ({ markdownText }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [markdownText]);

  return (
    <ReactMarkdown
      components={{
        p: ({ node, children }) => {
          // Process each child, and if it's a hex color, use ColorRenderer
          const processedChildren = children.map((child, i) => {
            if (typeof child === "string" && hexColorRegex.test(child)) {
              return child
                .split(/(\s+)/)
                .map((part, index) =>
                  hexColorRegex.test(part) ? (
                    <ColorRenderer key={index} value={part} />
                  ) : (
                    part
                  )
                );
            }
            return child;
          });
          return <p>{processedChildren}</p>;
        },
        a: ({ href, children }) => (
          <a href={href} className="custom-link">
            {children}
          </a>
        ),
        img: ImageComponent,
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <pre className={`${className} language- code-block`} {...props}>
              <code>{children}</code>
            </pre>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        table: DokulyMarkdownTable,
        blockquote: BlockquoteComponent,
      }}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      children={markdownText}
    />
  );
};

export default DokulyMarkdown;
