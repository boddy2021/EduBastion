import styles from './Icon.module.css';

const Icon = ({ svg, size, className = '' }) => {
    const html = size
        ? svg.replace('<svg', `<svg width="${size}" height="${size}"`)
        : svg;

    return (
        <span
            className={`${styles.icon} ${className}`.trim()}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default Icon;
