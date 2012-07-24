#!/usr/bin/perl

use strict;
use POSIX qw(strftime);
use Time::ParseDate qw(parsedate);
use JSON;

# YY   MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
# yr   mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
# 2010 07 27 14 06 120  2.1  2.1    MM    MM    MM  MM 1018.6  26.2  24.2    MM   MM   MM    MM

sub c_to_f { return $_[0] * 1.8 + 32.0; }

sub median { my @x = sort { $a <=> $b } @_; return $x[@x/2]; }
sub max { my @x = sort { $a <=> $b } @_; return $x[-1]; }
sub min { my @x = sort { $a <=> $b } @_; return $x[0]; }

sub foo {
    my(%byhour, @lastday_samples);

    my $oneweek = parsedate("-1 week");
    my $lastday = parsedate("-24 hours");

    open(my $D, "-|", "curl -s http://www.ndbc.noaa.gov/data/realtime2/DUKN7.txt") || die $!;

    while(<$D>) {
      chop;
      my($YY, $MM, $DD, $hh, $mm, $WDIR, $WSPD, $GST, $WVHT, $DPD, $APD, $MWD, $PRES, $ATMP, $WTMP, $DEWP, $VIS, $PTDY, $TIDE)
      = split /\s+/;
      next unless $YY > 2000;
      $ATMP = c_to_f($ATMP);
      $WTMP = c_to_f($WTMP);

      my $mytime = parsedate("$YY-$MM-$DD $hh:$mm", GMT=>1, ZONE=>"EST5EDT");
      last if $mytime < $oneweek;

      my $myhournice = strftime("%a %l%p", localtime($mytime));
      my $myhour = strftime("%Y/%m/%d %H", localtime($mytime));
      if($mytime >= $lastday) {
        push @lastday_samples, { air => $ATMP, water => $WTMP, timestamp => $mytime };
      }

      $byhour{$myhour}{hour} ||= $myhournice;
      push @{$byhour{$myhour}{air}{samples}}, $ATMP;
      push @{$byhour{$myhour}{water}{samples}}, $WTMP;
    }
    return { by_hour => \%byhour, last_day => \@lastday_samples };
}

my $data = foo();

foreach my $hour (keys %{$data->{by_hour}}) {
  $data->{by_hour}{$hour}{air}{max} = max(@{$data->{by_hour}{$hour}{air}{samples}});
  $data->{by_hour}{$hour}{air}{min} = min(@{$data->{by_hour}{$hour}{air}{samples}});
  $data->{by_hour}{$hour}{air}{median} = median(@{$data->{by_hour}{$hour}{air}{samples}});
  $data->{by_hour}{$hour}{water}{max} = max(@{$data->{by_hour}{$hour}{water}{samples}});
  $data->{by_hour}{$hour}{water}{min} = min(@{$data->{by_hour}{$hour}{water}{samples}});
  $data->{by_hour}{$hour}{water}{median} = median(@{$data->{by_hour}{$hour}{water}{samples}});
}

my %summary = ( air => { max_day => max(map { $_->{air} } @{$data->{last_day}}),
                         min_day => min(map { $_->{air} } @{$data->{last_day}}),
                         max_week => max(map { @{$data->{by_hour}{$_}{air}{samples}} } keys %{$data->{by_hour}}),
                         min_week => min(map { @{$data->{by_hour}{$_}{air}{samples}} } keys %{$data->{by_hour}}),
                         current => $data->{last_day}[0]{air} },
                water => { max_day => max(map { $_->{water} } @{$data->{last_day}}),
                           min_day => min(map { $_->{water} } @{$data->{last_day}}),
                           max_week => max(map { @{$data->{by_hour}{$_}{water}{samples}} } keys %{$data->{by_hour}}),
                           min_week => min(map { @{$data->{by_hour}{$_}{water}{samples}} } keys %{$data->{by_hour}}),
                           current => $data->{last_day}[0]{water} },
                current_time => strftime("%a %l:%M%p", localtime($data->{last_day}[0]{timestamp})));

print to_json({
    summary => \%summary,
    data => [ map { $data->{by_hour}{$_} } sort keys %{$data->{by_hour}} ] },
  { pretty => 1 });
