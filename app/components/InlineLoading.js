import styles from '../loading.module.css';

export default function InlineLoading({ text = 'Loading...' }) {
  return (
    <div className={styles.inlineLoading}>
      <div className={styles.inlineSpinner}></div>
      <p className={styles.inlineText}>{text}</p>
    </div>
  );
}
