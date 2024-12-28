import {CommonModule, isPlatformBrowser} from "@angular/common";
import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  ViewChild,
} from "@angular/core";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {Subject} from "rxjs";

@Component({
  selector: "om-marquee",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./ngx-marquee.component.html",
  styleUrl: "./ngx-marquee.component.scss",
})
export class NgxMarqueeComponent implements AfterViewInit, AfterContentChecked, OnDestroy {
  @ViewChild("OmMarquee") marqueeRef!: ElementRef<HTMLElement>;

  @ContentChildren("OmMarqueeContent") elementRefs?: QueryList<ElementRef<HTMLElement>>;

  @Input("styleClass")
  styleClass?: string;

  @Input("reverse")
  set reverse(reverse: boolean) {
    if (reverse) {
      this.style["--om-marquee-reverse"] = "reverse";
      return;
    }

    this.style["--om-marquee-reverse"] = "";
  }

  @Input("animationDuration")
  set animationDuration(animationDuration: string) {
    this.style["--om-marquee-animation-duration"] = animationDuration;
  }

  @Input("marqueeGap")
  set marqueeGap(marqueeGap: string) {
    this.style["--om-marquee-gap"] = marqueeGap;
  }

  @Input("pauseOnHover")
  set pauseOnHover(pauseOnHover: boolean) {
    if (pauseOnHover) {
      this.style["--om-marquee-pause"] = "paused";
      return;
    }

    this.style["--om-marquee-pause"] = "running";
  }

  @Input("vertical")
  vertical = false;

  style: any = {};

  marqueeElements: SafeHtml[] = [];

  isInView = false;
  private intersectionObserver?: IntersectionObserver;

  private contentSnapshot: string[] = [];

  constructor(
    private readonly sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
  }

  ngAfterViewInit(): void {
    this.getMarqueeContent();

    if (isPlatformBrowser(this.platformId)) {
      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          if (!this.isInView) {
            this.isInView = true;
          }
        } else if (this.isInView) {
          this.isInView = false;
        }
      });
      this.intersectionObserver.observe(this.marqueeRef.nativeElement);
    }
  }

  ngAfterContentChecked() {
    if (!this.elementRefs) {
      return;
    }

    const currentContentSnapshot = this.elementRefs.map(
      (ref) => ref.nativeElement.innerHTML
    );

    if (
      JSON.stringify(this.contentSnapshot) !==
      JSON.stringify(currentContentSnapshot)
    ) {
      this.contentSnapshot = currentContentSnapshot;
      this.getMarqueeContent();
    }
  }

  destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private getMarqueeContent(): void {
    if (!this.elementRefs) {
      return;
    }

    this.marqueeElements = this.elementRefs?.toArray().map((ref) => {
      return this.sanitizer.bypassSecurityTrustHtml(
        ref.nativeElement.outerHTML
      );
    });

    this.cdr.detectChanges();
  }
}
